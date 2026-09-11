import { randomBytes, randomUUID } from "node:crypto";
import { CertificateStatus, UserRole } from "@prisma/client";
import { ApiError } from "../api";
import type { Principal } from "../auth";
import { requireRole } from "../policy";
import { digitalCertificateRepository } from "../repositories/digital-certificate-repository";
import { prisma } from "../prisma";
import { auditService } from "./audit-service";
import { notificationService } from "./notification-service";
import { verificationApplicationRepository } from "../repositories/verification-application-repository";

function publicUrl(token: string) { return `/api/v1/public/certificates/verify?token=${encodeURIComponent(token)}`; }
function liveStatus(status: CertificateStatus, validTo: Date) { return status === CertificateStatus.ACTIVE && validTo < new Date() ? CertificateStatus.EXPIRED : status; }
export function serialize(certificate: { certificateNumber: string; issuedAt: Date; validFrom: Date; validTo: Date; status: CertificateStatus; qrCodeToken: string; documentHash: string | null; revokedAt: Date | null; revocationReason: string | null; instrument: { digitalInstrumentId: string; instrumentType: string; category: string; serialNumber: string; currentOwnerId?: string }; application: { applicationNumber: string; status: string; applicationType: string }; verification: { resultStatus: string; verificationDate: Date; certificateEligible: boolean | null }; issuedBy: { fullName: string } }) {
  return { certificateNumber: certificate.certificateNumber, issuedAt: certificate.issuedAt, validFrom: certificate.validFrom, validTo: certificate.validTo, status: liveStatus(certificate.status, certificate.validTo), qrCodeToken: certificate.qrCodeToken, publicVerificationUrl: publicUrl(certificate.qrCodeToken), documentHash: certificate.documentHash, revokedAt: certificate.revokedAt, revocationReason: certificate.revocationReason, instrument: { publicInstrumentId: certificate.instrument.digitalInstrumentId, instrumentType: certificate.instrument.instrumentType, category: certificate.instrument.category, serialNumber: certificate.instrument.serialNumber }, applicationNumber: certificate.application.applicationNumber, applicationStatus: certificate.application.status, applicationType: certificate.application.applicationType, verificationResult: certificate.verification.resultStatus, verificationDate: certificate.verification.verificationDate, issuedByName: certificate.issuedBy.fullName };
}

function publicSerialize(certificate: { certificateNumber: string; validFrom: Date; validTo: Date; status: CertificateStatus; instrument: { digitalInstrumentId: string; instrumentType: string; category: string }; }) {
  return { valid: liveStatus(certificate.status, certificate.validTo) === CertificateStatus.ACTIVE, certificateNumber: certificate.certificateNumber, status: liveStatus(certificate.status, certificate.validTo), validFrom: certificate.validFrom, validTo: certificate.validTo, instrument: { publicInstrumentId: certificate.instrument.digitalInstrumentId, instrumentType: certificate.instrument.instrumentType, category: certificate.instrument.category } };
}

export function requireStatusTransition(current: CertificateStatus, next: CertificateStatus) {
  const allowed: Record<CertificateStatus, CertificateStatus[]> = { ACTIVE: [CertificateStatus.SUSPENDED, CertificateStatus.REVOKED, CertificateStatus.EXPIRED, CertificateStatus.REPLACED, CertificateStatus.VOID], SUSPENDED: [CertificateStatus.ACTIVE, CertificateStatus.REVOKED, CertificateStatus.VOID], EXPIRED: [CertificateStatus.REPLACED, CertificateStatus.VOID], REVOKED: [CertificateStatus.REPLACED, CertificateStatus.VOID], REPLACED: [CertificateStatus.VOID], VOID: [] };
  if (!allowed[current].includes(next)) throw new ApiError(409, "INVALID_CERTIFICATE_TRANSITION", `Certificate cannot transition from ${current} to ${next}`);
}

export const digitalCertificateService = {
  async list(principal: Principal, filters: { status?: CertificateStatus; instrumentId?: string; query?: string }, skip: number, take: number) { const [certificates, total] = await digitalCertificateRepository.list(principal, filters, skip, take); return { certificates: certificates.map(serialize), total }; },
  async get(principal: Principal, id: string) { const certificate = await digitalCertificateRepository.findAccessible(principal, id); if (!certificate) throw new ApiError(404, "CERTIFICATE_NOT_FOUND", "Certificate not found"); return serialize(certificate); },
  async issue(principal: Principal, verificationId: string, input: { validFrom?: Date; validTo: Date; documentHash?: string }) {
    requireRole(principal, [UserRole.ADMINISTRATOR]);
    const verification = await prisma.fieldVerification.findUnique({ where: { id: verificationId }, select: { id: true, applicationId: true, instrumentId: true, resultStatus: true, certificateEligible: true, assignment: { select: { status: true, applicationId: true, instrumentId: true } }, application: { select: { status: true, instrumentId: true } }, instrument: { select: { id: true } } } });
    if (!verification || verification.applicationId !== verification.assignment.applicationId || verification.instrumentId !== verification.assignment.instrumentId || verification.instrumentId !== verification.application.instrumentId) throw new ApiError(400, "INVALID_CERTIFICATE_CHAIN", "Verification chain is invalid");

    // Log for debugging
    console.log("Issuance Check - App Status:", verification.application.status, "Assignment Status:", verification.assignment.status, "Result Status:", verification.resultStatus, "Eligible:", verification.certificateEligible);

    // The check was too strict. We only need the application to be in a state that allows certification.
    // In our workflow, once the field verification is submitted, the application status is set to VERIFIED.
    if (verification.application.status !== "VERIFIED" || verification.assignment.status !== "COMPLETED" || verification.resultStatus !== "PASS" || verification.certificateEligible !== true) throw new ApiError(409, "CERTIFICATE_NOT_ELIGIBLE", `Only an eligible PASS verification on a VERIFIED application can produce a certificate. Current: Status=${verification.resultStatus}, Eligible=${verification.certificateEligible}, AppStatus=${verification.application.status}, AssignStatus=${verification.assignment.status}`);
    if (new Date(input.validTo) <= (input.validFrom ?? new Date())) throw new ApiError(400, "INVALID_CERTIFICATE_DATES", "validTo must be after validFrom");
    if (await digitalCertificateRepository.findByVerification(verificationId) || await digitalCertificateRepository.findActiveByApplication(verification.applicationId)) throw new ApiError(409, "CERTIFICATE_EXISTS", "An active certificate already exists for this verification or application");
    const data = { certificateNumber: `EVM-CERT-${randomUUID()}`, instrumentId: verification.instrumentId, applicationId: verification.applicationId, verificationId, issuedByUserId: principal.userId, validFrom: input.validFrom ?? new Date(), validTo: input.validTo, qrCodeToken: randomBytes(32).toString("base64url"), documentHash: input.documentHash };
    const certificate = await prisma.$transaction(async (tx) => {
      const created = await tx.digitalCertificate.create({ data, select: { id: true, certificateNumber: true } });
      await tx.certificateStatusHistory.create({ data: { certificateId: created.id, newStatus: CertificateStatus.ACTIVE, changedByUserId: principal.userId, notes: "Certificate issued" } });
      await tx.verificationApplication.update({ where: { id: verification.applicationId }, data: { status: "CERTIFICATE_ISSUED" } });
      return created;
    });

    // Notify Business Owner
    const application = await verificationApplicationRepository.findById(verification.applicationId);
    if (application) {
      await notificationService.create({
        recipientUserId: application.submittedByUserId,
        instrumentId: verification.instrumentId,
        certificateId: certificate.id,
        type: "CERTIFICATE_ISSUED",
        title: "Certificate Issued",
        message: `Your digital certificate ${certificate.certificateNumber} for instrument ${verification.instrumentId} has been issued.`,
      });
    }

    await auditService.record({ actorUserId: principal.userId, certificateId: certificate.id, applicationId: verification.applicationId, verificationId, instrumentId: verification.instrumentId, actionType: "CERTIFICATE_ISSUED", notes: "Digital certificate issued" });
    return this.get(principal, certificate.certificateNumber);
  },
  async changeStatus(principal: Principal, id: string, next: CertificateStatus, reason: string) {
    requireRole(principal, [UserRole.ADMINISTRATOR]);
    const certificate = await digitalCertificateRepository.findById(id); if (!certificate) throw new ApiError(404, "CERTIFICATE_NOT_FOUND", "Certificate not found");
    requireStatusTransition(certificate.status, next);
    const updated = await prisma.$transaction(async (tx) => { const changed = await tx.digitalCertificate.update({ where: { id }, data: { status: next, ...(next === CertificateStatus.REVOKED ? { revokedAt: new Date(), revocationReason: reason } : {}) }, select: { id: true } }); await tx.certificateStatusHistory.create({ data: { certificateId: id, previousStatus: certificate.status, newStatus: next, changedByUserId: principal.userId, reason, notes: `Certificate status changed to ${next}` } }); return changed; });
    await auditService.record({ actorUserId: principal.userId, certificateId: id, applicationId: certificate.applicationId, verificationId: certificate.verificationId, instrumentId: certificate.instrumentId, actionType: next === CertificateStatus.REVOKED ? "REVOKED" : "UPDATED", notes: reason });

    // Notify Business Owner on Revocation or Suspension
    if (next === CertificateStatus.REVOKED || next === CertificateStatus.SUSPENDED) {
      const instrument = await prisma.instrument.findUnique({ where: { id: certificate.instrumentId }, select: { currentOwnerId: true } });
      if (instrument?.currentOwnerId) {
        await notificationService.create({
          recipientUserId: instrument.currentOwnerId,
          instrumentId: certificate.instrumentId,
          certificateId: id,
          type: next === CertificateStatus.REVOKED ? "CERTIFICATE_REVOKED" : "CERTIFICATE_SUSPENDED",
          title: next === CertificateStatus.REVOKED ? "Certificate Revoked" : "Certificate Suspended",
          message: `Your certificate ${certificate.certificateNumber} has been ${next.toLowerCase()}. Reason: ${reason}`,
        });
      }
    }

    return this.get(principal, certificate.certificateNumber);
  },
  async history(principal: Principal, certificateNumber: string) { const certificate = await digitalCertificateRepository.findById(certificateNumber); if (!certificate) throw new ApiError(404, "CERTIFICATE_NOT_FOUND", "Certificate not found"); const accessible = await digitalCertificateRepository.findAccessible(principal, certificateNumber); if (!accessible) throw new ApiError(404, "CERTIFICATE_NOT_FOUND", "Certificate not found"); return digitalCertificateRepository.statusHistory(certificate.id); },
  async verifyPublic(token: string | undefined, certificateNumber: string | undefined) { if (!token && !certificateNumber) throw new ApiError(400, "CERTIFICATE_LOOKUP_REQUIRED", "A verification token or certificate number is required"); const certificate = token ? await digitalCertificateRepository.findPublicByToken(token) : await prisma.digitalCertificate.findUnique({ where: { certificateNumber }, select: { certificateNumber: true, validFrom: true, validTo: true, status: true, instrument: { select: { digitalInstrumentId: true, instrumentType: true, category: true } } } }); if (!certificate) throw new ApiError(404, "CERTIFICATE_NOT_FOUND", "Certificate not found"); return publicSerialize(certificate); },
};