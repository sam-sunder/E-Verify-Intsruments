import { AssignmentStatus, UserRole } from "@prisma/client";
import type { Principal } from "../auth";
import { prisma } from "../prisma";

const assignmentFields = {
  id: true,
  status: true,
  assignedAt: true,
  acceptedAt: true,
  dueDate: true,
  completedAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  application: { select: { applicationNumber: true, status: true, applicationType: true } },
  instrument: { select: { digitalInstrumentId: true, instrumentType: true, category: true, serialNumber: true } },
  assignedOfficer: { select: { fullName: true } },
  fieldVerification: { select: { id: true, resultStatus: true } },
} as const;

function accessWhere(principal: Principal) {
  if (principal.role === UserRole.ADMINISTRATOR) return {};
  return { assignedOfficerId: principal.userId };
}

export const officerAssignmentRepository = {
  list(principal: Principal, filters: { status?: AssignmentStatus; applicationId?: string; assignedOfficerId?: string; query?: string }, skip: number, take: number) {
    const where = {
      ...accessWhere(principal),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.applicationId ? { application: { applicationNumber: filters.applicationId } } : {}),
      ...(principal.role === UserRole.ADMINISTRATOR && filters.assignedOfficerId ? { assignedOfficerId: filters.assignedOfficerId } : {}),
      ...(filters.query ? { OR: [{ application: { applicationNumber: { contains: filters.query } } }, { instrument: { digitalInstrumentId: { contains: filters.query } } }, { instrument: { serialNumber: { contains: filters.query } } }] } : {}),
    };
    return Promise.all([
      prisma.officerAssignment.findMany({ where, select: assignmentFields, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.officerAssignment.count({ where }),
    ]);
  },
  findAccessible(principal: Principal, id: string) {
    return prisma.officerAssignment.findFirst({ where: { id, ...accessWhere(principal) }, select: { ...assignmentFields, id: true, applicationId: true, instrumentId: true, assignedOfficerId: true } });
  },
  findById(id: string) {
    return prisma.officerAssignment.findUnique({ where: { id }, select: { ...assignmentFields, id: true, applicationId: true, instrumentId: true, assignedOfficerId: true } });
  },
  findActiveByApplication(applicationId: string) {
    return prisma.officerAssignment.findFirst({ where: { applicationId, status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED, AssignmentStatus.IN_PROGRESS] } }, select: { id: true } });
  },
  create(data: { applicationId: string; instrumentId: string; assignedOfficerId: string; dueDate?: Date; notes?: string }) {
    return prisma.officerAssignment.create({ data, select: { ...assignmentFields, id: true, applicationId: true, instrumentId: true, assignedOfficerId: true } });
  },
  transition(id: string, data: { status: AssignmentStatus; acceptedAt?: Date; completedAt?: Date }) {
    return prisma.officerAssignment.update({ where: { id }, data, select: { ...assignmentFields, id: true, applicationId: true, instrumentId: true, assignedOfficerId: true } });
  },
};