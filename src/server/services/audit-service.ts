import { AuditActionType } from "@prisma/client";
import { prisma } from "../prisma";

export const auditService = {
  record(input: { actorUserId?: string; actionType: AuditActionType; notes?: string; instrumentId?: string; applicationId?: string; assignmentId?: string; verificationId?: string; certificateId?: string }) {
    return prisma.auditLog.create({ data: input });
  },
};