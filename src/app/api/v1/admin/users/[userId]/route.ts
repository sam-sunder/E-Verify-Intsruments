import { UserRole } from "@prisma/client";
import { z } from "zod";
import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive, requireRole } from "@/server/policy";
import { userRepository } from "@/server/repositories/user-repository";
import { authService } from "@/server/services/auth-service";

const updateSchema = z.object({ fullName: z.string().min(1).max(200).optional(), phone: z.string().max(40).nullable().optional(), role: z.enum([UserRole.BUSINESS_OWNER, UserRole.OFFICER]).optional() }).refine((value) => Object.keys(value).length > 0);

export const GET = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  requireRole(principal, [UserRole.ADMINISTRATOR]);
  const { userId } = await (context as { params: Promise<{ userId: string }> }).params;
  return ok(await userRepository.findById(userId));
});

export const PATCH = routeHandler(async (request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  requireRole(principal, [UserRole.ADMINISTRATOR]);
  const { userId } = await (context as { params: Promise<{ userId: string }> }).params;
  return ok(await authService.updateManagedUser(principal.userId, userId, updateSchema.parse(await request.json())));
});