import { VerificationStatus, UserRole } from "@prisma/client";
import type { Principal } from "../auth";
import { prisma } from "../prisma";

const measurementFields = { id: true, measurementType: true, parameterName: true, standardValue: true, measuredValue: true, unit: true, tolerance: true, calculatedError: true, standardReference: true, passFail: true, recordedAt: true, createdAt: true } as const;
const evidenceFields = { id: true, fileUrl: true, storageKey: true, photoType: true, caption: true, capturedAt: true, isPrimaryEvidence: true, createdAt: true } as const;
const verificationFields = {
  verificationDate: true,
  resultStatus: true,
  findingsSummary: true,
  isCompliant: true,
  recommendedAction: true,
  certificateEligible: true,
  remarks: true,
  createdAt: true,
  updatedAt: true,
  assignment: { select: { status: true, assignedOfficerId: true, applicationId: true, instrumentId: true, application: { select: { applicationNumber: true, status: true, instrumentId: true } }, instrument: { select: { digitalInstrumentId: true, serialNumber: true, instrumentType: true } } } },
  measurements: { select: measurementFields, orderBy: { recordedAt: "asc" } },
  evidencePhotos: { select: evidenceFields, orderBy: { capturedAt: "asc" } },
} as const;

function accessWhere(principal: Principal) {
  if (principal.role === UserRole.ADMINISTRATOR) return {};
  return { verifiedByUserId: principal.userId };
}

export const fieldVerificationRepository = {
  findAccessible(principal: Principal, id: string) {
    return prisma.fieldVerification.findFirst({ where: { id, ...accessWhere(principal) }, select: { ...verificationFields, id: true, assignmentId: true, applicationId: true, instrumentId: true, verifiedByUserId: true } });
  },
  findByAssignment(assignmentId: string) {
    return prisma.fieldVerification.findUnique({ where: { assignmentId }, select: { ...verificationFields, id: true, assignmentId: true, applicationId: true, instrumentId: true, verifiedByUserId: true } });
  },
  create(data: { assignmentId: string; applicationId: string; instrumentId: string; verifiedByUserId: string; verificationDate?: Date; resultStatus: VerificationStatus; findingsSummary?: string; isCompliant?: boolean; recommendedAction?: string; certificateEligible?: boolean; remarks?: string }) {
    return prisma.fieldVerification.create({ data, select: { ...verificationFields, id: true, assignmentId: true, applicationId: true, instrumentId: true, verifiedByUserId: true } });
  },
  update(id: string, data: { resultStatus?: VerificationStatus; findingsSummary?: string | null; isCompliant?: boolean | null; recommendedAction?: string | null; certificateEligible?: boolean | null; remarks?: string | null }) {
    return prisma.fieldVerification.update({ where: { id }, data, select: { ...verificationFields, id: true, assignmentId: true, applicationId: true, instrumentId: true, verifiedByUserId: true } });
  },
  addMeasurement(data: { verificationId: string; instrumentId: string; measurementType: string; parameterName: string; standardValue?: string; measuredValue: string; unit?: string; tolerance?: string; calculatedError?: string; standardReference?: string; passFail: boolean }) {
    return prisma.measurementRecord.create({ data, select: measurementFields });
  },
  listMeasurements(verificationId: string) {
    return prisma.measurementRecord.findMany({ where: { verificationId }, select: measurementFields, orderBy: { recordedAt: "asc" } });
  },
  updateMeasurement(id: string, data: { measurementType?: string; parameterName?: string; standardValue?: string | null; measuredValue?: string; unit?: string | null; tolerance?: string | null; calculatedError?: string | null; standardReference?: string | null; passFail?: boolean }) {
    return prisma.measurementRecord.update({ where: { id }, data, select: measurementFields });
  },
  findMeasurement(id: string) {
    return prisma.measurementRecord.findUnique({ where: { id }, select: { ...measurementFields, verification: { select: { id: true, verifiedByUserId: true, assignmentId: true } } } });
  },
  deleteMeasurement(id: string) { return prisma.measurementRecord.delete({ where: { id } }); },
  addEvidence(data: { verificationId: string; instrumentId: string; fileUrl: string; storageKey?: string; photoType: string; caption?: string; capturedAt?: Date; isPrimaryEvidence?: boolean }) {
    return prisma.evidencePhoto.create({ data, select: evidenceFields });
  },
  listEvidence(verificationId: string) {
    return prisma.evidencePhoto.findMany({ where: { verificationId }, select: evidenceFields, orderBy: { capturedAt: "asc" } });
  },
  findEvidence(id: string) {
    return prisma.evidencePhoto.findUnique({ where: { id }, select: { ...evidenceFields, verification: { select: { id: true, verifiedByUserId: true, assignmentId: true } } } });
  },
  deleteEvidence(id: string) { return prisma.evidencePhoto.delete({ where: { id } }); },
};