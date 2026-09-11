import { ApplicationStatus, ApplicationType, UserRole, UserStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { ApiError } from "../api";
import type { Principal } from "../auth";
import { requireOwnerOrAdmin, requireRole } from "../policy";
import { instrumentRepository } from "../repositories/instrument-repository";
import { userRepository } from "../repositories/user-repository";
import { verificationApplicationRepository } from "../repositories/verification-application-repository";
import { auditService } from "./audit-service";
import { officerAssignmentService } from "./officer-assignment-service";
import { notificationService } from "./notification-service";

export function serialize(application: { applicationNumber: string; applicationType: ApplicationType; status: ApplicationStatus; submittedAt: Date; reviewedAt: Date | null; dueDate: Date | null; remarks: string | null; createdAt: Date; updatedAt: Date; instrument: { digitalInstrumentId: string; instrumentType: string; category: string; serialNumber: string }; submittedBy: { fullName: string }; reviewedBy: { fullName: string } | null }) {
  return { applicationNumber: application.applicationNumber, applicationType: application.applicationType, status: application.status, submittedAt: application.submittedAt, reviewedAt: application.reviewedAt, dueDate: application.dueDate, remarks: application.remarks, createdAt: application.createdAt, updatedAt: application.updatedAt, instrument: application.instrument, submittedByName: application.submittedBy.fullName, reviewedByName: application.reviewedBy?.fullName ?? null };
}

function applicationNumber() {
  return `EVM-APP-${randomUUID()}`;
}

export function requireApplicationTransition(status: ApplicationStatus, allowed: ApplicationStatus[]) {
  if (!allowed.includes(status)) throw new ApiError(409, "INVALID_APPLICATION_TRANSITION", `Application cannot transition from ${status}`);
}

async function assertInstrumentOwner(principal: Principal, instrumentId: string) {
  const instrument = await instrumentRepository.findAccessible(principal, instrumentId);
  if (!instrument) throw new ApiError(404, "INSTRUMENT_NOT_FOUND", "Instrument not found");
  if (principal.role === UserRole.BUSINESS_OWNER) requireOwnerOrAdmin(principal, instrument.currentOwnerId);
  return instrument;
}

export const verificationApplicationService = {
  async list(principal: Principal, filters: { query?: string; status?: ApplicationStatus; applicationType?: ApplicationType; instrumentId?: string }, skip: number, take: number) {
    const [applications, total] = await verificationApplicationRepository.list(principal, filters, skip, take);
    return { applications: applications.map(serialize), total };
  },
  async get(principal: Principal, id: string) {
    const application = await verificationApplicationRepository.findAccessible(principal, id);
    if (!application) throw new ApiError(404, "APPLICATION_NOT_FOUND", "Verification application not found");
    return serialize(application);
  },
  async create(principal: Principal, input: { instrumentId: string; applicationType: ApplicationType; remarks?: string; dueDate?: Date; previousApplicationId?: string; submittedByUserId?: string }) {
    requireRole(principal, [UserRole.BUSINESS_OWNER, UserRole.ADMINISTRATOR]);
    const instrument = await assertInstrumentOwner(principal, input.instrumentId);
    let submittedByUserId = principal.userId;
    if (principal.role === UserRole.ADMINISTRATOR) {
      if (!input.submittedByUserId) throw new ApiError(400, "SUBMITTER_REQUIRED", "Administrator-created applications require a Business Owner submitter");
      const submitter = await userRepository.findById(input.submittedByUserId);
      if (!submitter || submitter.role !== UserRole.BUSINESS_OWNER || submitter.status !== UserStatus.ACTIVE) throw new ApiError(400, "INVALID_SUBMITTER", "The submitter must be an active Business Owner");
      submittedByUserId = input.submittedByUserId;
    }
    if (input.applicationType === ApplicationType.RE_VERIFICATION && !input.previousApplicationId) {
      throw new ApiError(400, "PREVIOUS_APPLICATION_REQUIRED", "Re-verification requires a previous application");
    }
    if (input.applicationType === ApplicationType.RE_VERIFICATION && input.previousApplicationId) {
      const previous = await verificationApplicationRepository.findById(input.previousApplicationId);
      if (!previous || previous.instrumentId !== instrument.id) throw new ApiError(400, "INVALID_PREVIOUS_APPLICATION", "The previous application does not belong to this instrument");
    }
    const application = await verificationApplicationRepository.create({ applicationNumber: applicationNumber(), instrumentId: instrument.id, submittedByUserId, applicationType: input.applicationType, remarks: input.remarks, dueDate: input.dueDate });
    await auditService.record({ actorUserId: principal.userId, applicationId: application.id, instrumentId: instrument.id, actionType: "CREATED", notes: input.applicationType === ApplicationType.RE_VERIFICATION ? "New re-verification application created; previous history preserved" : "Verification application created" });
    return serialize(application);
  },
  async update(principal: Principal, id: string, input: { remarks?: string | null; dueDate?: Date | null }) {
    const application = await verificationApplicationRepository.findAccessible(principal, id);
    if (!application) throw new ApiError(404, "APPLICATION_NOT_FOUND", "Verification application not found");
    requireOwnerOrAdmin(principal, application.submittedByUserId);
    requireApplicationTransition(application.status, [ApplicationStatus.DRAFT]);
    const updated = await verificationApplicationRepository.updateDraft(id, input);
    await auditService.record({ actorUserId: principal.userId, applicationId: id, instrumentId: application.instrumentId, actionType: "UPDATED", notes: "Draft application updated" });
    return serialize(updated);
  },
  async submit(principal: Principal, id: string) {
    const application = await verificationApplicationRepository.findAccessible(principal, id);
    if (!application) throw new ApiError(404, "APPLICATION_NOT_FOUND", "Verification application not found");
    requireOwnerOrAdmin(principal, application.submittedByUserId);
    requireApplicationTransition(application.status, [ApplicationStatus.DRAFT]);
    const updated = await verificationApplicationRepository.transition(id, { status: ApplicationStatus.SUBMITTED });
    await auditService.record({ actorUserId: principal.userId, applicationId: application.id, instrumentId: application.instrumentId, actionType: "UPDATED", notes: "Application submitted: DRAFT -> SUBMITTED" });

    // Notify all active administrators
    const [admins] = await userRepository.list("", UserRole.ADMINISTRATOR, UserStatus.ACTIVE, 0, 100);
    await Promise.all(admins.map(admin => notificationService.create({
      recipientUserId: admin.id,
      instrumentId: application.instrumentId,
      type: "APPLICATION_SUBMITTED",
      title: "New Application Submitted",
      message: `Application ${updated.applicationNumber} for instrument ${updated.instrument.digitalInstrumentId} has been submitted for review.`,
    })));

    return serialize(updated);
  },
  async startReview(principal: Principal, id: string) {
    return this.adminTransition(principal, id, ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, "Application review started", "UPDATED");
  },
  async approve(principal: Principal, id: string) {
    const serializedApp = await this.adminTransition(principal, id, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.ASSIGNED, "Application approved and advanced to assignment-ready state", "APPROVED");
    const application = await verificationApplicationRepository.findById(id);
    if (!application) throw new ApiError(404, "APPLICATION_NOT_FOUND", "Verification application not found");

    // Notify submitter
    await notificationService.create({
      recipientUserId: application.submittedByUserId,
      instrumentId: application.instrumentId,
      type: "APPLICATION_APPROVED",
      title: "Application Approved",
      message: `Your verification application ${application.applicationNumber} has been approved and is awaiting officer assignment.`,
    });

    // Round Robin Officer Assignment
    try {
      const [officers] = await userRepository.list("", UserRole.OFFICER, UserStatus.ACTIVE, 0, 100);
      if (officers.length === 0) throw new Error("No active officers available for assignment");

      // Find the officer who was assigned least recently
      // For simplicity, we'll pick the officer with the minimum number of active assignments.
      let selectedOfficerId = officers[0].id;
      let minAssignments = Infinity;

      for (const officer of officers) {
        const { assignments } = await officerAssignmentService.list(principal, { assignedOfficerId: officer.id }, 0, 100);
        const activeCount = assignments.filter(a => a.status !== "COMPLETED" && a.status !== "CANCELLED" && a.status !== "REJECTED").length;
        if (activeCount < minAssignments) {
          minAssignments = activeCount;
          selectedOfficerId = officer.id;
        }
      }

      await officerAssignmentService.create(principal, {
        applicationId: id,
        assignedOfficerId: selectedOfficerId,
        notes: "Automatically assigned via round-robin load balancing",
      });
    } catch (err) {
      console.error("Round-robin assignment failed:", err);
      // We don't throw here because the application is already approved and in ASSIGNED state;
      // the administrator can still manually assign an officer via the Assignment Manager.
    }

    return serializedApp;
  },
  async reject(principal: Principal, id: string, reason: string) {
    const serializedApp = await this.adminTransition(principal, id, [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.ASSIGNED], ApplicationStatus.REJECTED, `Application rejected: ${reason}`, "REJECTED");
    const application = await verificationApplicationRepository.findById(id);
    if (!application) throw new ApiError(404, "APPLICATION_NOT_FOUND", "Verification application not found");

    // Notify submitter
    await notificationService.create({
      recipientUserId: application.submittedByUserId,
      instrumentId: application.instrumentId,
      type: "APPLICATION_REJECTED",
      title: "Application Rejected",
      message: `Your verification application ${application.applicationNumber} has been rejected. Reason: ${reason}`,
    });

    return serializedApp;
  },
  async cancel(principal: Principal, id: string, reason: string) {
    return this.adminTransition(principal, id, [ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW], ApplicationStatus.CANCELLED, `Application cancelled: ${reason}`, "UPDATED");
  },
  async adminTransition(principal: Principal, id: string, from: ApplicationStatus | ApplicationStatus[], to: ApplicationStatus, notes: string, actionType: "UPDATED" | "APPROVED" | "REJECTED") {
    requireRole(principal, [UserRole.ADMINISTRATOR]);
    const application = await verificationApplicationRepository.findById(id);
    if (!application) throw new ApiError(404, "APPLICATION_NOT_FOUND", "Verification application not found");
    requireApplicationTransition(application.status, Array.isArray(from) ? from : [from]);
    const updated = await verificationApplicationRepository.transition(id, { status: to, reviewedByUserId: principal.userId, reviewedAt: new Date() });
    await auditService.record({ actorUserId: principal.userId, applicationId: application.id, instrumentId: application.instrumentId, actionType, notes: `${notes}: ${application.status} -> ${to}` });
    return serialize(updated);
  },
};