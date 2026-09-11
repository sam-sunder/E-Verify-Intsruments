import { NotificationChannel } from "@prisma/client";
import { prisma } from "../prisma";

const notificationFields = { id: true, type: true, title: true, message: true, channel: true, isRead: true, createdAt: true, readAt: true, instrument: { select: { digitalInstrumentId: true } }, certificate: { select: { certificateNumber: true } } } as const;

export const notificationRepository = {
  list(userId: string, unreadOnly: boolean, skip: number, take: number) {
    const where = { recipientUserId: userId, ...(unreadOnly ? { isRead: false } : {}) };
    return Promise.all([prisma.notification.findMany({ where, select: notificationFields, orderBy: { createdAt: "desc" }, skip, take }), prisma.notification.count({ where })]);
  },
  findForUser(id: string, userId: string) { return prisma.notification.findFirst({ where: { id, recipientUserId: userId }, select: notificationFields }); },
  markRead(id: string, userId: string) { return prisma.notification.updateMany({ where: { id, recipientUserId: userId }, data: { isRead: true, readAt: new Date() } }); },
  markAllRead(userId: string) { return prisma.notification.updateMany({ where: { recipientUserId: userId, isRead: false }, data: { isRead: true, readAt: new Date() } }); },
  findDuplicate(input: { recipientUserId: string; certificateId: string; type: string; title: string }) { return prisma.notification.findFirst({ where: input, select: { id: true } }); },
  create(input: { recipientUserId: string; instrumentId?: string; certificateId?: string; type: string; title: string; message: string }) { return prisma.notification.create({ data: { ...input, channel: NotificationChannel.IN_APP }, select: notificationFields }); },
};