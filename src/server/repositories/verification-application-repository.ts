import { ApplicationStatus, ApplicationType, UserRole } from "@prisma/client";
import type { Principal } from "../auth";
import { prisma } from "../prisma";

const applicationFields = {
  applicationNumber: true,
  applicationType: true,
  status: true,
  submittedAt: true,
  reviewedAt: true,
  dueDate: true,
  remarks: true,
  createdAt: true,
  updatedAt: true,
  instrument: { select: { digitalInstrumentId: true, instrumentType: true, category: true, serialNumber: true } },
  submittedBy: { select: { fullName: true } },
  reviewedBy: { select: { fullName: true } },
} as const;

function accessWhere(principal: Principal) {
  if (principal.role === UserRole.ADMINISTRATOR) return {};
  if (principal.role === UserRole.BUSINESS_OWNER) return { submittedByUserId: principal.userId };
  return { assignments: { some: { assignedOfficerId: principal.userId } } };
}

export const verificationApplicationRepository = {
  list(principal: Principal, filters: { query?: string; status?: ApplicationStatus; applicationType?: ApplicationType; instrumentId?: string }, skip: number, take: number) {
    const where = {
      ...accessWhere(principal),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.applicationType ? { applicationType: filters.applicationType } : {}),
      ...(filters.instrumentId ? { instrument: { digitalInstrumentId: filters.instrumentId } } : {}),
      ...(filters.query ? { OR: [{ applicationNumber: { contains: filters.query } }, { instrument: { digitalInstrumentId: { contains: filters.query } } }, { instrument: { serialNumber: { contains: filters.query } } }] } : {}),
    };
    return Promise.all([
      prisma.verificationApplication.findMany({ where, select: applicationFields, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.verificationApplication.count({ where }),
    ]);
  },
  findAccessible(principal: Principal, applicationNumber: string) {
    return prisma.verificationApplication.findFirst({ where: { applicationNumber, ...accessWhere(principal) }, select: { ...applicationFields, id: true, instrumentId: true, submittedByUserId: true } });
  },
  findById(applicationNumber: string) {
    return prisma.verificationApplication.findUnique({ where: { applicationNumber }, select: { ...applicationFields, id: true, instrumentId: true, submittedByUserId: true } });
  },
  create(data: { applicationNumber: string; instrumentId: string; submittedByUserId: string; applicationType: ApplicationType; remarks?: string; dueDate?: Date }) {
    return prisma.verificationApplication.create({ data, select: { ...applicationFields, id: true, instrumentId: true, submittedByUserId: true } });
  },
  updateDraft(applicationNumber: string, data: { remarks?: string | null; dueDate?: Date | null }) {
    return prisma.verificationApplication.update({ where: { applicationNumber }, data, select: { ...applicationFields, id: true, instrumentId: true, submittedByUserId: true } });
  },
  transition(applicationNumber: string, data: { status: ApplicationStatus; reviewedByUserId?: string; reviewedAt?: Date }) {
    return prisma.verificationApplication.update({ where: { applicationNumber }, data, select: { ...applicationFields, id: true, instrumentId: true, submittedByUserId: true } });
  },
};