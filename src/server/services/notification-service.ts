import type { Principal } from "../auth";
import { ApiError } from "../api";
import { complianceService } from "./compliance-service";
import { notificationRepository } from "../repositories/notification-repository";

export const notificationService = {
  async list(principal: Principal, unreadOnly: boolean, skip: number, take: number) {
    await complianceService.sync(principal);
    const [notifications, total] = await notificationRepository.list(principal.userId, unreadOnly, skip, take);
    return { notifications, total };
  },
  async markRead(principal: Principal, id: string) {
    const notification = await notificationRepository.findForUser(id, principal.userId);
    if (!notification) throw new ApiError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");
    await notificationRepository.markRead(id, principal.userId);
    return { success: true };
  },
  async markAllRead(principal: Principal) {
    const result = await notificationRepository.markAllRead(principal.userId);
    return { success: true, count: result.count };
  },
  async create(input: { recipientUserId: string; instrumentId?: string; certificateId?: string; type: string; title: string; message: string }) {
    return notificationRepository.create(input);
  },
};
