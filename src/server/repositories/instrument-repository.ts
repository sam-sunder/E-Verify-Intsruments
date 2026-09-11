import { InstrumentStatus, UserRole } from "@prisma/client";
import type { Principal } from "../auth";
import { prisma } from "../prisma";

const instrumentFields = {
  digitalInstrumentId: true,
  instrumentType: true,
  category: true,
  manufacturer: true,
  model: true,
  serialNumber: true,
  registrationNumber: true,
  capacity: true,
  unitOfMeasure: true,
  currentLocation: true,
  status: true,
  isActive: true,
  createdAt: true,
  registeredAt: true,
  lastVerifiedAt: true,
  nextDueDate: true,
  remarks: true,
  currentOwner: { select: { fullName: true } },
} as const;

function accessWhere(principal: Principal) {
  if (principal.role === UserRole.ADMINISTRATOR) return {};
  if (principal.role === UserRole.BUSINESS_OWNER) return { currentOwnerId: principal.userId };
  return { assignments: { some: { assignedOfficerId: principal.userId } } };
}

export const instrumentRepository = {
  list(principal: Principal, filters: { query?: string; status?: InstrumentStatus; instrumentType?: string; category?: string; currentLocation?: string }, skip: number, take: number) {
    const query = filters.query;
    const where = {
      ...accessWhere(principal),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.instrumentType ? { instrumentType: filters.instrumentType } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.currentLocation ? { currentLocation: { contains: filters.currentLocation } } : {}),
      ...(query ? { OR: [{ digitalInstrumentId: { contains: query } }, { serialNumber: { contains: query } }, { registrationNumber: { contains: query } }, { manufacturer: { contains: query } }, { model: { contains: query } }] } : {}),
    };
    return Promise.all([
      prisma.instrument.findMany({ where, select: instrumentFields, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.instrument.count({ where }),
    ]);
  },
  findAccessible(principal: Principal, publicInstrumentId: string) {
    return prisma.instrument.findFirst({ where: { digitalInstrumentId: publicInstrumentId, ...accessWhere(principal) }, select: { ...instrumentFields, id: true, currentOwnerId: true } });
  },
  create(data: { digitalInstrumentId: string; instrumentType: string; category: string; manufacturer?: string; model?: string; serialNumber: string; registrationNumber?: string; capacity?: string; unitOfMeasure?: string; currentOwnerId: string; currentLocation?: string; remarks?: string }) {
    return prisma.instrument.create({ data, select: { ...instrumentFields, id: true, currentOwnerId: true } });
  },
  update(publicInstrumentId: string, data: { instrumentType?: string; category?: string; manufacturer?: string | null; model?: string | null; serialNumber?: string; registrationNumber?: string | null; capacity?: string | null; unitOfMeasure?: string | null; currentLocation?: string | null; remarks?: string | null }) {
    return prisma.instrument.update({ where: { digitalInstrumentId: publicInstrumentId }, data, select: { ...instrumentFields, id: true, currentOwnerId: true } });
  },
  archive(publicInstrumentId: string) {
    return prisma.instrument.update({ where: { digitalInstrumentId: publicInstrumentId }, data: { status: InstrumentStatus.ARCHIVED, isActive: false }, select: { ...instrumentFields, id: true, currentOwnerId: true } });
  },
  history(principal: Principal, publicInstrumentId: string) {
    return prisma.instrument.findFirst({
      where: { digitalInstrumentId: publicInstrumentId, ...accessWhere(principal) },
      select: {
        ownershipHistory: { orderBy: { effectiveFrom: "desc" }, select: { previousOwner: { select: { fullName: true } }, newOwner: { select: { fullName: true } }, effectiveFrom: true, effectiveTo: true, reason: true, approvedBy: { select: { fullName: true } }, createdAt: true } },
        locationHistory: { orderBy: { effectiveFrom: "desc" }, select: { previousLocation: true, newLocation: true, effectiveFrom: true, effectiveTo: true, reason: true, approvedBy: { select: { fullName: true } }, createdAt: true } },
        fieldVerifications: { orderBy: { verificationDate: "desc" }, select: { verificationDate: true, resultStatus: true, findingsSummary: true, isCompliant: true, certificateEligible: true } },
        certificates: { orderBy: { issuedAt: "desc" }, select: { certificateNumber: true, issuedAt: true, validFrom: true, validTo: true, status: true } },
        complianceRecords: { orderBy: { assessmentDate: "desc" }, select: { assessmentDate: true, complianceStatus: true, riskScore: true, riskLevel: true, summary: true, recommendedAction: true } },
        enforcementRecords: { orderBy: { initiatedAt: "desc" }, select: { caseNumber: true, caseType: true, severity: true, initiatedAt: true, reason: true, actionTaken: true, status: true, resolvedAt: true } },
        auditLogs: { orderBy: { changedAt: "desc" }, select: { actionType: true, oldValue: true, newValue: true, changedAt: true, notes: true } },
      },
    });
  },
};