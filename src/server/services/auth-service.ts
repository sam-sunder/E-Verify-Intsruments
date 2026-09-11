import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";
import { ApiError } from "../api";
import { issueTokens, type Principal } from "../auth";
import { prisma } from "../prisma";
import { userRepository } from "../repositories/user-repository";
import { auditService } from "./audit-service";

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    if (user.status !== UserStatus.ACTIVE) throw new ApiError(403, "ACCOUNT_INACTIVE", "This account is not active");
    const principal: Principal = { userId: user.id, role: user.role, status: user.status };
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await auditService.record({ actorUserId: user.id, actionType: "UPDATED", notes: "User logged in" });
    return { user: userRepository.findById(user.id), tokens: await issueTokens(principal) };
  },
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) throw new ApiError(400, "INVALID_PASSWORD", "Current password is incorrect");
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
    await auditService.record({ actorUserId: userId, actionType: "UPDATED", notes: "Password changed" });
  },
  async createManagedUser(actorUserId: string, input: { email: string; fullName: string; phone?: string; role: UserRole; password: string }) {
    if (input.role !== UserRole.BUSINESS_OWNER && input.role !== UserRole.OFFICER) throw new ApiError(400, "INVALID_ROLE", "Only Business Owners and Officers may be created here");
    const user = await userRepository.create({ ...input, email: input.email.toLowerCase(), passwordHash: await bcrypt.hash(input.password, 12) });
    await auditService.record({ actorUserId, actionType: "CREATED", notes: `Created user ${user.id}` });
    return user;
  },
  async updateManagedUser(actorUserId: string, userId: string, input: { fullName?: string; phone?: string | null; role?: UserRole }) {
    if (input.role && input.role !== UserRole.BUSINESS_OWNER && input.role !== UserRole.OFFICER) throw new ApiError(400, "INVALID_ROLE", "Only Business Owners and Officers may be assigned here");
    const user = await userRepository.update(userId, input);
    await auditService.record({ actorUserId, actionType: "UPDATED", notes: `Updated managed user ${userId}` });
    return user;
  },
  async setManagedUserStatus(actorUserId: string, userId: string, status: UserStatus, reason: string) {
    const user = await userRepository.update(userId, { status });
    await auditService.record({ actorUserId, actionType: "UPDATED", notes: `${status === UserStatus.ACTIVE ? "Activated" : "Deactivated"} user ${userId}: ${reason}` });
    return user;
  },
};