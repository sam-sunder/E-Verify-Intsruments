import { CertificateStatus, ComplianceStatus, UserRole } from "@prisma/client";
import type { Principal } from "../auth";
import { prisma } from "../prisma";

function accessWhere(principal: Principal) {
  if (principal.role === UserRole.ADMINISTRATOR) return {};
  if (principal.role === UserRole.BUSINESS_OWNER) return { instrument: { currentOwnerId: principal.userId } };
  return { instrument: { assignments: { some: { assignedOfficerId: principal.userId } } } };
}

const recordFields = { complianceStatus: true, riskScore: true, riskLevel: true, summary: true, recommendedAction: true, assessmentDate: true, createdAt: true, instrument: { select: { digitalInstrumentId: true, instrumentType: true, category: true, serialNumber: true } } } as const;

export const complianceRepository = {
  list(principal: Principal, filters: { instrumentId?: string; complianceStatus?: ComplianceStatus }, skip: number, take: number) {
    const where = { ...accessWhere(principal), ...(filters.instrumentId ? { instrument: { digitalInstrumentId: filters.instrumentId } } : {}), ...(filters.complianceStatus ? { complianceStatus: filters.complianceStatus } : {}) };
    return Promise.all([prisma.complianceRecord.findMany({ where, select: recordFields, orderBy: { assessmentDate: "desc" }, skip, take }), prisma.complianceRecord.count({ where })]);
  },
  history(principal: Principal, publicInstrumentId: string) {
    return prisma.complianceRecord.findMany({ where: { instrument: { digitalInstrumentId: publicInstrumentId }, ...accessWhere(principal) }, select: recordFields, orderBy: { assessmentDate: "desc" } });
  },
  latest(instrumentId: string) { return prisma.complianceRecord.findFirst({ where: { instrumentId }, orderBy: { assessmentDate: "desc" }, select: { complianceStatus: true, summary: true } }); },
  create(data: { instrumentId: string; complianceStatus: ComplianceStatus; summary: string; recommendedAction?: string }) { return prisma.complianceRecord.create({ data, select: recordFields }); },
  certificates(principal: Principal, instrumentId?: string) {
    const where = { ...accessWhere(principal), status: { in: [CertificateStatus.ACTIVE, CertificateStatus.SUSPENDED] }, ...(instrumentId ? { instrument: { digitalInstrumentId: instrumentId } } : {}) };
    return prisma.digitalCertificate.findMany({ where, select: { id: true, certificateNumber: true, validTo: true, status: true, instrumentId: true, instrument: { select: { digitalInstrumentId: true, currentOwnerId: true } } }, orderBy: { validTo: "asc" } });
  },
};