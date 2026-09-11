import Decimal from "decimal.js";
import { ApplicationStatus, AssignmentStatus, UserRole, UserStatus, VerificationStatus } from "@prisma/client";
import { ApiError } from "../api";
import { randomUUID } from "node:crypto";
import type { Principal } from "../auth";
import { requireRole } from "../policy";
import { officerAssignmentRepository } from "../repositories/officer-assignment-repository";
import { verificationApplicationRepository } from "../repositories/verification-application-repository";
import { fieldVerificationRepository } from "../repositories/field-verification-repository";
import { auditService } from "./audit-service";
import { prisma } from "../prisma";
import { evidenceStorage } from "../evidence-storage";
import { notificationService } from "./notification-service";
import { userRepository } from "../repositories/user-repository";

function decimal(value: string, field: string) {
  try {
    const parsed = new Decimal(value);
    if (!parsed.isFinite()) throw new Error();
    return parsed;
  } catch {
    throw new ApiError(400, "INVALID_MEASUREMENT_VALUE", `${field} must be a finite decimal string`);
  }
}

function decimalString(value: Decimal) { return value.toFixed(); }
export function calculateMeasurement(input: { standardValue?: string; measuredValue: string; tolerance?: string }) {
  const measured = decimal(input.measuredValue, "measuredValue");
  if (input.standardValue === undefined) return { calculatedError: undefined, passFail: true };
  const standard = decimal(input.standardValue, "standardValue");
  const error = measured.minus(standard);
  const tolerance = input.tolerance === undefined ? undefined : decimal(input.tolerance, "tolerance").abs();
  return { calculatedError: decimalString(error), passFail: tolerance === undefined ? error.isZero() : error.abs().lessThanOrEqualTo(tolerance) };
}

async function assignedOfficer(principal: Principal, assignmentId: string) {
  const assignment = await officerAssignmentRepository.findById(assignmentId);
  if (!assignment) throw new ApiError(404, "ASSIGNMENT_NOT_FOUND", "Assignment not found");
  if (assignment.assignedOfficerId !== principal.userId) throw new ApiError(403, "FORBIDDEN", "Only the assigned Officer can perform this operation");
  return assignment;
}

function ensureMutable(verification: { assignment: { status: AssignmentStatus; application: { status: ApplicationStatus } } }) {
  if (verification.assignment.status === AssignmentStatus.COMPLETED || verification.assignment.application.status === ApplicationStatus.VERIFIED) {
    throw new ApiError(409, "VERIFICATION_FINALIZED", "Finalized verification records are immutable");
  }
}

export const fieldVerificationService = {
  async get(principal: Principal, id: string) {
    if (principal.role !== UserRole.ADMINISTRATOR && principal.role !== UserRole.OFFICER) throw new ApiError(403, "FORBIDDEN", "Business Owners cannot access field verification records");
    const verification = await fieldVerificationRepository.findAccessible(principal, id);
    if (!verification) throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Field verification not found");
    return verification;
  },
  async getByApplication(principal: Principal, applicationNumber: string) {
    if (principal.role !== UserRole.ADMINISTRATOR && principal.role !== UserRole.OFFICER) throw new ApiError(403, "FORBIDDEN", "Business Owners cannot access field verification records");
    const verification = await prisma.fieldVerification.findFirst({
      where: { application: { applicationNumber } },
      orderBy: { createdAt: "desc" },
      include: { assignment: { include: { application: true, instrument: true } }, measurements: true, evidencePhotos: true }
    });
    if (!verification) throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Field verification not found for this application");
    return verification;
  },
  async create(principal: Principal, assignmentId: string, input: { verificationDate?: Date; findingsSummary?: string; remarks?: string }) {
    requireRole(principal, [UserRole.OFFICER]);
    const assignment = await assignedOfficer(principal, assignmentId);
    if (assignment.status !== AssignmentStatus.ACCEPTED && assignment.status !== AssignmentStatus.IN_PROGRESS) throw new ApiError(409, "ASSIGNMENT_NOT_READY", "Assignment must be accepted before verification begins");
    const existing = await fieldVerificationRepository.findByAssignment(assignmentId);
    if (existing) throw new ApiError(409, "VERIFICATION_EXISTS", "This assignment already has a field verification");
    const verification = await fieldVerificationRepository.create({ assignmentId, applicationId: assignment.applicationId, instrumentId: assignment.instrumentId, verifiedByUserId: principal.userId, verificationDate: input.verificationDate, resultStatus: VerificationStatus.NOT_ELIGIBLE, findingsSummary: input.findingsSummary, remarks: input.remarks });
    if (assignment.status === AssignmentStatus.ACCEPTED) await officerAssignmentRepository.transition(assignmentId, { status: AssignmentStatus.IN_PROGRESS });
    await auditService.record({ actorUserId: principal.userId, verificationId: verification.id, assignmentId, applicationId: assignment.applicationId, instrumentId: assignment.instrumentId, actionType: "UPDATED", notes: "Field verification created; assignment moved to IN_PROGRESS" });
    return verification;
  },
  async update(principal: Principal, id: string, input: { findingsSummary?: string | null; recommendedAction?: string | null; certificateEligible?: boolean | null; remarks?: string | null }) {
    const verification = await fieldVerificationRepository.findAccessible(principal, id);
    if (!verification) throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Field verification not found");
    await assignedOfficer(principal, verification.assignmentId);
    ensureMutable(verification);
    return fieldVerificationRepository.update(id, input);
  },
  async submit(principal: Principal, id: string, input: { resultStatus: VerificationStatus; findingsSummary?: string; isCompliant?: boolean; recommendedAction?: string; certificateEligible?: boolean; remarks?: string }) {
    requireRole(principal, [UserRole.OFFICER]);
    const verification = await fieldVerificationRepository.findAccessible(principal, id);
    if (!verification) throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Field verification not found");
    const assignment = await assignedOfficer(principal, verification.assignmentId);
    ensureMutable(verification);
    if (assignment.status !== AssignmentStatus.IN_PROGRESS) throw new ApiError(409, "ASSIGNMENT_NOT_IN_PROGRESS", "Assignment must be in progress before submission");

    // Ensure consistency: if eligible for certificate, result status cannot be NOT_ELIGIBLE
    const finalInput: any = { ...input };
    if (input.certificateEligible && input.resultStatus === VerificationStatus.NOT_ELIGIBLE) {
      finalInput.resultStatus = VerificationStatus.PASS;
    }

    console.log(`[Submit Verification] ID: ${id}, Input Status: ${input.resultStatus}, Final Status: ${finalInput.resultStatus}`);

    const updated = await prisma.$transaction(async (tx) => {
      const submitted = await tx.fieldVerification.update({
        where: { id },
        data: {
          resultStatus: finalInput.resultStatus,
          findingsSummary: finalInput.findingsSummary,
          isCompliant: finalInput.isCompliant,
          recommendedAction: finalInput.recommendedAction,
          certificateEligible: finalInput.certificateEligible,
          remarks: finalInput.remarks,
        },
        select: { id: true, assignmentId: true, applicationId: true, instrumentId: true, resultStatus: true }
      });
      await tx.officerAssignment.update({ where: { id: assignment.id }, data: { status: AssignmentStatus.COMPLETED, completedAt: new Date() } });
      await tx.verificationApplication.update({ where: { id: assignment.applicationId }, data: { status: ApplicationStatus.VERIFIED }, select: { id: true } });
      return submitted;
    });

    // Notify Business Owner
    const application = await verificationApplicationRepository.findById(assignment.applicationId);
    if (application) {
      await notificationService.create({
        recipientUserId: application.submittedByUserId,
        instrumentId: assignment.instrumentId,
        type: "VERIFICATION_COMPLETED",
        title: "Verification Completed",
        message: `Field verification for instrument ${assignment.instrument.digitalInstrumentId} has been completed with result: ${updated.resultStatus}.`,
      });
    }

    // Notify all active administrators
    const [admins] = await userRepository.list("", UserRole.ADMINISTRATOR, UserStatus.ACTIVE, 0, 100);
    await Promise.all(admins.map(admin => notificationService.create({
      recipientUserId: admin.id,
      instrumentId: assignment.instrumentId,
      type: "VERIFICATION_COMPLETED",
      title: "Verification Completed",
      message: `Field verification for instrument ${assignment.instrument.digitalInstrumentId} (App: ${application?.applicationNumber}) has been completed.`,
    })));

    console.log(`[Submit Verification] DB Updated Status: ${updated.resultStatus}`);

    await auditService.record({ actorUserId: principal.userId, verificationId: id, assignmentId: assignment.id, applicationId: assignment.applicationId, instrumentId: assignment.instrumentId, actionType: "VERIFIED", notes: `Field verification finalized with ${updated.resultStatus}` });
    return this.get(principal, id);
  },
  async addMeasurement(principal: Principal, verificationId: string, input: { measurementType: string; parameterName: string; standardValue?: string; measuredValue: string; unit?: string; tolerance?: string; standardReference?: string }) {
    requireRole(principal, [UserRole.OFFICER]);
    const verification = await fieldVerificationRepository.findAccessible(principal, verificationId);
    if (!verification) throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Field verification not found");
    await assignedOfficer(principal, verification.assignmentId); ensureMutable(verification);
    const calculated = calculateMeasurement(input);
    return fieldVerificationRepository.addMeasurement({ ...input, verificationId, instrumentId: verification.instrumentId, ...calculated });
  },
  async updateMeasurement(principal: Principal, id: string, input: { measurementType?: string; parameterName?: string; standardValue?: string | null; measuredValue?: string; unit?: string | null; tolerance?: string | null; standardReference?: string | null }) {
    requireRole(principal, [UserRole.OFFICER]);
    const existing = await fieldVerificationRepository.findMeasurement(id); if (!existing) throw new ApiError(404, "MEASUREMENT_NOT_FOUND", "Measurement not found");
    await assignedOfficer(principal, existing.verification.assignmentId); const verification = await fieldVerificationRepository.findAccessible(principal, existing.verification.id); if (!verification) throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Field verification not found"); ensureMutable(verification);
    const inputWithValues = { measuredValue: input.measuredValue ?? existing.measuredValue, standardValue: input.standardValue === undefined ? existing.standardValue ?? undefined : input.standardValue ?? undefined, tolerance: input.tolerance === undefined ? existing.tolerance ?? undefined : input.tolerance ?? undefined };
    return fieldVerificationRepository.updateMeasurement(id, { ...input, ...calculateMeasurement(inputWithValues) });
  },
  async deleteMeasurement(principal: Principal, id: string) { const existing = await fieldVerificationRepository.findMeasurement(id); if (!existing) throw new ApiError(404, "MEASUREMENT_NOT_FOUND", "Measurement not found"); await assignedOfficer(principal, existing.verification.assignmentId); const verification = await fieldVerificationRepository.findAccessible(principal, existing.verification.id); if (!verification) throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Field verification not found"); ensureMutable(verification); await fieldVerificationRepository.deleteMeasurement(id); await auditService.record({ actorUserId: principal.userId, verificationId: existing.verification.id, actionType: "DELETED", notes: "Measurement deleted before finalization" }); return { success: true }; },
  async addEvidence(principal: Principal, verificationId: string, input: { fileUrl: string; storageKey?: string; photoType: string; caption?: string; capturedAt?: Date; isPrimaryEvidence?: boolean }) { requireRole(principal, [UserRole.OFFICER]); const verification = await fieldVerificationRepository.findAccessible(principal, verificationId); if (!verification) throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Field verification not found"); await assignedOfficer(principal, verification.assignmentId); ensureMutable(verification); return fieldVerificationRepository.addEvidence({ ...input, verificationId, instrumentId: verification.instrumentId }); },
  async listEvidence(principal: Principal, verificationId: string) { const verification = await this.get(principal, verificationId); return { verification, evidence: await fieldVerificationRepository.listEvidence(verificationId) }; },
  async uploadEvidence(principal: Principal, verificationId: string, input: { fileName: string; fileSize: number; contentType: string; fileData: Uint8Array; photoType: string; caption?: string; capturedAt?: Date; isPrimaryEvidence?: boolean }) {
    if (!input.fileName || input.fileSize <= 0 || input.fileSize > 10 * 1024 * 1024) throw new ApiError(400, "INVALID_EVIDENCE_FILE", "Evidence must be between 1 byte and 10 MB");
    if (!input.contentType.startsWith("image/")) throw new ApiError(400, "INVALID_EVIDENCE_TYPE", "Evidence must be an image");
    const storageKey = `evidence/${randomUUID()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await evidenceStorage.write(storageKey, input.fileData);
    return this.addEvidence(principal, verificationId, { fileUrl: `private://${storageKey}`, storageKey, photoType: input.photoType, caption: input.caption, capturedAt: input.capturedAt, isPrimaryEvidence: input.isPrimaryEvidence });
  },
  async evidenceAccess(principal: Principal, id: string) { if (principal.role !== UserRole.ADMINISTRATOR && principal.role !== UserRole.OFFICER) throw new ApiError(403, "FORBIDDEN", "Access denied"); const evidence = await fieldVerificationRepository.findEvidence(id); if (!evidence) throw new ApiError(404, "EVIDENCE_NOT_FOUND", "Evidence not found"); if (principal.role === UserRole.OFFICER) await assignedOfficer(principal, evidence.verification.assignmentId); return { evidenceId: evidence.id, accessUrl: `/api/v1/evidence/${id}/content`, expiresInSeconds: 300 }; },
  async evidenceContent(principal: Principal, id: string) { const evidence = await fieldVerificationRepository.findEvidence(id); if (!evidence) throw new ApiError(404, "EVIDENCE_NOT_FOUND", "Evidence not found"); if (principal.role !== UserRole.ADMINISTRATOR) await assignedOfficer(principal, evidence.verification.assignmentId); if (!evidence.storageKey) throw new ApiError(404, "EVIDENCE_STORAGE_NOT_FOUND", "Evidence file is not available"); return evidenceStorage.read(evidence.storageKey); },
  async deleteEvidence(principal: Principal, id: string) { requireRole(principal, [UserRole.OFFICER]); const evidence = await fieldVerificationRepository.findEvidence(id); if (!evidence) throw new ApiError(404, "EVIDENCE_NOT_FOUND", "Evidence not found"); await assignedOfficer(principal, evidence.verification.assignmentId); const verification = await fieldVerificationRepository.findAccessible(principal, evidence.verification.id); if (!verification) throw new ApiError(404, "VERIFICATION_NOT_FOUND", "Field verification not found"); ensureMutable(verification); await fieldVerificationRepository.deleteEvidence(id); await auditService.record({ actorUserId: principal.userId, verificationId: evidence.verification.id, actionType: "DELETED", notes: "Evidence deleted before finalization" }); return { success: true }; },
};