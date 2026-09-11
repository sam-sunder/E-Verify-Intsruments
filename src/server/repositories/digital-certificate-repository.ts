import { CertificateStatus, UserRole } from "@prisma/client";
import type { Principal } from "../auth";
import { prisma } from "../prisma";

const certificateFields = {
  certificateNumber: true,
  issuedAt: true,
  validFrom: true,
  validTo: true,
  status: true,
  qrCodeToken: true,
  documentHash: true,
  revokedAt: true,
  revocationReason: true,
  instrument: { select: { digitalInstrumentId: true, instrumentType: true, category: true, serialNumber: true, currentOwnerId: true } },
  application: { select: { applicationNumber: true, status: true, applicationType: true } },
  verification: { select: { resultStatus: true, verificationDate: true, certificateEligible: true } },
  issuedBy: { select: { fullName: true } },
} as const;

function accessWhere(principal: Principal) {
  if (principal.role === UserRole.ADMINISTRATOR) return {};
  if (principal.role === UserRole.BUSINESS_OWNER) return { instrument: { currentOwnerId: principal.userId } };
  return { instrument: { assignments: { some: { assignedOfficerId: principal.userId } } } };
}

export const digitalCertificateRepository = {
  list(principal: Principal, filters: { status?: CertificateStatus; instrumentId?: string; query?: string }, skip: number, take: number) {
    const where = {
      ...accessWhere(principal),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.instrumentId ? { instrument: { digitalInstrumentId: filters.instrumentId } } : {}),
      ...(filters.query ? { OR: [{ certificateNumber: { contains: filters.query } }, { instrument: { digitalInstrumentId: { contains: filters.query } } }, { instrument: { serialNumber: { contains: filters.query } } }] } : {}),
    };
    return Promise.all([
      prisma.digitalCertificate.findMany({ where, select: { ...certificateFields, id: true, instrumentId: true, applicationId: true, verificationId: true }, orderBy: { issuedAt: "desc" }, skip, take }),
      prisma.digitalCertificate.count({ where }),
    ]);
  },
  findAccessible(principal: Principal, certificateNumber: string) {
    return prisma.digitalCertificate.findFirst({ where: { certificateNumber, ...accessWhere(principal) }, select: { ...certificateFields, id: true, instrumentId: true, applicationId: true, verificationId: true } });
  },
  findById(certificateNumber: string) {
    return prisma.digitalCertificate.findUnique({ where: { certificateNumber }, select: { ...certificateFields, id: true, instrumentId: true, applicationId: true, verificationId: true } });
  },
  findPublicByToken(token: string) {
    return prisma.digitalCertificate.findUnique({ where: { qrCodeToken: token }, select: { ...certificateFields } });
  },
  findByVerification(verificationId: string) {
    return prisma.digitalCertificate.findUnique({ where: { verificationId }, select: { id: true, status: true, certificateNumber: true } });
  },
  findActiveByApplication(applicationId: string) {
    return prisma.digitalCertificate.findFirst({ where: { applicationId, status: { in: [CertificateStatus.ACTIVE, CertificateStatus.SUSPENDED] } }, select: { id: true } });
  },
  create(data: { certificateNumber: string; instrumentId: string; applicationId: string; verificationId: string; issuedByUserId: string; validFrom: Date; validTo: Date; qrCodeToken: string; documentHash?: string }) {
    return prisma.digitalCertificate.create({ data, select: { ...certificateFields, id: true, instrumentId: true, applicationId: true, verificationId: true } });
  },
  updateStatus(id: string, data: { status: CertificateStatus; revokedAt?: Date | null; revocationReason?: string | null }) {
    return prisma.digitalCertificate.update({ where: { id }, data, select: { ...certificateFields, id: true, instrumentId: true, applicationId: true, verificationId: true } });
  },
  addStatusHistory(data: { certificateId: string; previousStatus?: CertificateStatus; newStatus: CertificateStatus; changedByUserId?: string; reason?: string; notes?: string }) {
    return prisma.certificateStatusHistory.create({ data, select: { previousStatus: true, newStatus: true, changedByUserId: true, effectiveAt: true, reason: true, notes: true, createdAt: true } });
  },
  statusHistory(certificateId: string) {
    return prisma.certificateStatusHistory.findMany({ where: { certificateId }, select: { previousStatus: true, newStatus: true, effectiveAt: true, reason: true, notes: true, createdAt: true }, orderBy: { effectiveAt: "asc" } });
  },
};