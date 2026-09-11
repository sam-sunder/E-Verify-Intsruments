import { ApplicationStatus, AssignmentStatus, UserRole, UserStatus } from "@prisma/client";
import { ApiError } from "../api";
import type { Principal } from "../auth";
import { requireRole } from "../policy";
import { instrumentRepository } from "../repositories/instrument-repository";
import { userRepository } from "../repositories/user-repository";
import { verificationApplicationRepository } from "../repositories/verification-application-repository";
import { officerAssignmentRepository } from "../repositories/officer-assignment-repository";
import { auditService } from "./audit-service";
import { notificationService } from "./notification-service";

function serialize(assignment: { id: string; status: AssignmentStatus; assignedAt: Date; acceptedAt: Date | null; dueDate: Date | null; completedAt: Date | null; notes: string | null; createdAt: Date; updatedAt: Date; application: { applicationNumber: string; status: ApplicationStatus; applicationType: string }; instrument: { digitalInstrumentId: string; instrumentType: string; category: string; serialNumber: string }; assignedOfficer: { fullName: string }; fieldVerification?: { id: string; resultStatus: string } | null }) {
  return { id: assignment.id, status: assignment.status, assignedAt: assignment.assignedAt, acceptedAt: assignment.acceptedAt, dueDate: assignment.dueDate, completedAt: assignment.completedAt, notes: assignment.notes, createdAt: assignment.createdAt, updatedAt: assignment.updatedAt, application: assignment.application, instrument: assignment.instrument, assignedOfficerName: assignment.assignedOfficer.fullName, fieldVerification: assignment.fieldVerification ? { id: assignment.fieldVerification.id, resultStatus: assignment.fieldVerification.resultStatus } : null };
}

export function requireAssignmentTransition(status: AssignmentStatus, allowed: AssignmentStatus[]) {
  if (!allowed.includes(status)) throw new ApiError(409, "INVALID_ASSIGNMENT_TRANSITION", `Assignment cannot transition from ${status}`);
}

function assertOfficer(principal: Principal) {
  requireRole(principal, [UserRole.OFFICER]);
}

export const officerAssignmentService = {
  async list(principal: Principal, filters: { status?: AssignmentStatus; applicationId?: string; assignedOfficerId?: string; query?: string }, skip: number, take: number) {
    if (principal.role === UserRole.BUSINESS_OWNER) throw new ApiError(403, "FORBIDDEN", "Business Owners cannot access assignments directly");
    const [assignments, total] = await officerAssignmentRepository.list(principal, filters, skip, take);
    return { assignments: assignments.map(serialize), total };
  },
  async get(principal: Principal, id: string) {
    if (principal.role === UserRole.BUSINESS_OWNER) throw new ApiError(403, "FORBIDDEN", "Business Owners cannot access assignments directly");
    const assignment = await officerAssignmentRepository.findAccessible(principal, id);
    if (!assignment) throw new ApiError(404, "ASSIGNMENT_NOT_FOUND", "Officer assignment not found");
    return serialize(assignment);
  },
  async create(principal: Principal, input: { applicationId: string; assignedOfficerId: string; dueDate?: Date; notes?: string }) {
    requireRole(principal, [UserRole.ADMINISTRATOR]);
    const application = await verificationApplicationRepository.findById(input.applicationId);
    if (!application || application.status !== ApplicationStatus.ASSIGNED) throw new ApiError(409, "APPLICATION_NOT_ELIGIBLE", "Only applications in ASSIGNED state can receive an assignment");
    const officer = await userRepository.findById(input.assignedOfficerId);
    if (!officer || officer.role !== UserRole.OFFICER || officer.status !== UserStatus.ACTIVE) throw new ApiError(400, "INVALID_OFFICER", "The assigned user must be an active Officer");
    const existing = await officerAssignmentRepository.findActiveByApplication(input.applicationId);
    if (existing) throw new ApiError(409, "ACTIVE_ASSIGNMENT_EXISTS", "This application already has an active assignment");
    const assignment = await officerAssignmentRepository.create({ applicationId: application.id, instrumentId: application.instrumentId, assignedOfficerId: input.assignedOfficerId, dueDate: input.dueDate, notes: input.notes });
    await auditService.record({ actorUserId: principal.userId, applicationId: application.id, assignmentId: assignment.id, instrumentId: application.instrumentId, actionType: "ASSIGNED", notes: "Officer assignment created: ASSIGNED" });

    // Notify Officer
    await notificationService.create({
      recipientUserId: input.assignedOfficerId,
      instrumentId: application.instrumentId,
      type: "ASSIGNMENT_CREATED",
      title: "New Verification Assignment",
      message: `You have been assigned to verify instrument ${application.instrument.digitalInstrumentId} (Application: ${application.applicationNumber}).`,
    });

    // Notify Business Owner
    await notificationService.create({
      recipientUserId: application.submittedByUserId,
      instrumentId: application.instrumentId,
      type: "OFFICER_ASSIGNED",
      title: "Officer Assigned",
      message: `Officer ${officer.fullName} has been assigned to your verification application ${application.applicationNumber}.`,
    });

    return serialize(assignment);
  },
  async transition(principal: Principal, id: string, from: AssignmentStatus[], to: AssignmentStatus, data: { acceptedAt?: Date; completedAt?: Date }, notes: string) {
    assertOfficer(principal);
    const assignment = await officerAssignmentRepository.findAccessible(principal, id);
    if (!assignment) throw new ApiError(404, "ASSIGNMENT_NOT_FOUND", "Officer assignment not found");
    requireAssignmentTransition(assignment.status, from);
    const updated = await officerAssignmentRepository.transition(id, { status: to, ...data });
    await auditService.record({ actorUserId: principal.userId, assignmentId: id, applicationId: assignment.applicationId, instrumentId: assignment.instrumentId, actionType: "UPDATED", notes: `${notes}: ${assignment.status} -> ${to}` });
    return serialize(updated);
  },
  async cancel(principal: Principal, id: string, reason: string) {
    requireRole(principal, [UserRole.ADMINISTRATOR]);
    const assignment = await officerAssignmentRepository.findById(id);
    if (!assignment) throw new ApiError(404, "ASSIGNMENT_NOT_FOUND", "Officer assignment not found");
    requireAssignmentTransition(assignment.status, [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED, AssignmentStatus.IN_PROGRESS]);
    const updated = await officerAssignmentRepository.transition(id, { status: AssignmentStatus.CANCELLED });
    await auditService.record({ actorUserId: principal.userId, assignmentId: id, applicationId: assignment.applicationId, instrumentId: assignment.instrumentId, actionType: "UPDATED", notes: `Assignment cancelled: ${reason}` });
    return serialize(updated);
  },
  async reject(principal: Principal, id: string, reason: string) {
    assertOfficer(principal);
    const assignment = await officerAssignmentRepository.findAccessible(principal, id);
    if (!assignment) throw new ApiError(404, "ASSIGNMENT_NOT_FOUND", "Officer assignment not found");
    requireAssignmentTransition(assignment.status, [AssignmentStatus.ASSIGNED]);
    const updated = await officerAssignmentRepository.transition(id, { status: AssignmentStatus.REJECTED });
    await auditService.record({ actorUserId: principal.userId, assignmentId: id, applicationId: assignment.applicationId, instrumentId: assignment.instrumentId, actionType: "UPDATED", notes: `Assignment rejected: ${reason}` });
    return serialize(updated);
  },
};