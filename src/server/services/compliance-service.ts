import { CertificateStatus, ComplianceStatus, UserRole } from "@prisma/client";
import { ApiError } from "../api";
import type { Principal } from "../auth";
import { requireRole } from "../policy";
import { complianceRepository } from "../repositories/compliance-repository";
import { notificationRepository } from "../repositories/notification-repository";
import { prisma } from "../prisma";
import { auditService } from "./audit-service";

export type CertificateExpiryState = "VALID" | "UPCOMING" | "DUE_SOON" | "CRITICAL" | "EXPIRED";

export function certificateExpiryState(validTo: Date, now = new Date()): CertificateExpiryState {
  const days = (validTo.getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return "EXPIRED";
  if (days > 90) return "VALID";
  if (days >= 30) return "UPCOMING";
  if (days >= 7) return "DUE_SOON";
  return "CRITICAL";
}

function derivedStatus(state: CertificateExpiryState, certificateStatus: CertificateStatus): ComplianceStatus {
  if (certificateStatus === CertificateStatus.SUSPENDED) return ComplianceStatus.SUSPENDED;
  if (state === "VALID") return ComplianceStatus.COMPLIANT;
  if (state === "UPCOMING" || state === "DUE_SOON") return ComplianceStatus.WARNING;
  return ComplianceStatus.NON_COMPLIANT;
}

function summary(state: CertificateExpiryState) { return `Instrument certificate validity state: ${state}`; }

async function syncCertificate(certificate: { id: string; certificateNumber: string; validTo: Date; status: CertificateStatus; instrumentId: string; instrument?: { currentOwnerId: string } }) {
  const state = certificateExpiryState(certificate.validTo);
  const complianceStatus = derivedStatus(state, certificate.status);
  if (state !== "VALID") {
    const title = `Certificate ${state.toLowerCase().replace("_", " ")}`;
    if (certificate.instrument && !(await notificationRepository.findDuplicate({ recipientUserId: certificate.instrument.currentOwnerId, certificateId: certificate.id, type: "CERTIFICATE_EXPIRY", title }))) {
      await notificationRepository.create({ recipientUserId: certificate.instrument.currentOwnerId, instrumentId: certificate.instrumentId, certificateId: certificate.id, type: "CERTIFICATE_EXPIRY", title, message: `${certificate.certificateNumber} is ${state.toLowerCase().replace("_", " ")}.` });
    }
  }
  return { certificateNumber: certificate.certificateNumber, instrumentId: certificate.instrumentId, state, complianceStatus, validTo: certificate.validTo, certificateStatus: certificate.status };
}

const severity: Record<CertificateExpiryState, number> = { VALID: 0, UPCOMING: 1, DUE_SOON: 2, CRITICAL: 3, EXPIRED: 4 };

export const complianceService = {
  async sync(principal: Principal, instrumentId?: string) {
    const certificates = await complianceRepository.certificates(principal, instrumentId);
    const states = await Promise.all(certificates.map(syncCertificate));
    const byInstrument = new Map<string, typeof states[number]>();
    for (const state of states) {
      const current = byInstrument.get(state.instrumentId);
      if (!current || severity[state.state] > severity[current.state]) byInstrument.set(state.instrumentId, state);
    }
    for (const state of byInstrument.values()) {
      const latest = await complianceRepository.latest(state.instrumentId);
      const recordSummary = summary(state.state);
      if (!latest || latest.summary !== recordSummary || latest.complianceStatus !== state.complianceStatus) {
        await complianceRepository.create({ instrumentId: state.instrumentId, complianceStatus: state.complianceStatus, summary: recordSummary, recommendedAction: state.state === "VALID" ? undefined : "Review certificate validity and initiate re-verification where required" });
        await auditService.record({ instrumentId: state.instrumentId, actionType: "UPDATED", notes: `Derived compliance state changed to ${state.complianceStatus} (${state.state})` });
      }
    }
    return states;
  },
  async summary(principal: Principal) {
    const states = await this.sync(principal);
    return { totals: states.reduce<Record<CertificateExpiryState, number>>((result, item) => { result[item.state] += 1; return result; }, { VALID: 0, UPCOMING: 0, DUE_SOON: 0, CRITICAL: 0, EXPIRED: 0 }), certificates: states };
  },
  async list(principal: Principal, filters: { instrumentId?: string; complianceStatus?: ComplianceStatus }, skip: number, take: number) {
    await this.sync(principal, filters.instrumentId);
    const [records, total] = await complianceRepository.list(principal, filters, skip, take);
    return { records, total };
  },
  async history(principal: Principal, instrumentId: string) {
    await this.sync(principal, instrumentId);
    const records = await complianceRepository.history(principal, instrumentId);
    if (records.length === 0 && principal.role === UserRole.BUSINESS_OWNER) throw new ApiError(404, "COMPLIANCE_NOT_FOUND", "Compliance history not found");
    return records;
  },
  async assess(principal: Principal, instrumentId: string, input: { summary: string; recommendedAction?: string }) {
    requireRole(principal, [UserRole.ADMINISTRATOR]);
    const instrument = await prisma.instrument.findUnique({ where: { digitalInstrumentId: instrumentId }, select: { id: true } });
    if (!instrument) throw new ApiError(404, "INSTRUMENT_NOT_FOUND", "Instrument not found");
    const derived = await this.sync(principal, instrumentId);
    const current = derived[0];
    const record = await complianceRepository.create({ instrumentId: instrument.id, complianceStatus: current?.complianceStatus ?? ComplianceStatus.REVERIFICATION_REQUIRED, summary: input.summary, recommendedAction: input.recommendedAction });
    await auditService.record({ actorUserId: principal.userId, instrumentId: instrument.id, actionType: "UPDATED", notes: "Administrator compliance assessment recorded" });
    return record;
  },
};