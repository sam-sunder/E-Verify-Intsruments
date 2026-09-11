import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { created, paged, pagination, ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive, requireRole } from "@/server/policy";
import { userRepository } from "@/server/repositories/user-repository";
import { authService } from "@/server/services/auth-service";

const createSchema = z.object({ email: z.string().email(), fullName: z.string().min(1).max(200), phone: z.string().max(40).optional(), role: z.enum([UserRole.BUSINESS_OWNER, UserRole.OFFICER]), password: z.string().min(12).max(200) });

export const GET = routeHandler(async (request) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  requireRole(principal, [UserRole.ADMINISTRATOR]);
  const url = new URL(request.url);
  const { page, pageSize, skip } = pagination(request);
  const role = url.searchParams.get("role") as UserRole | null;
  const status = url.searchParams.get("status") as UserStatus | null;
  const [users, total] = await userRepository.list(url.searchParams.get("query") ?? undefined, role ?? undefined, status ?? undefined, skip, pageSize);
  return ok(paged(users, page, pageSize, total));
});

export const POST = routeHandler(async (request) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  requireRole(principal, [UserRole.ADMINISTRATOR]);
  return created(await authService.createManagedUser(principal.userId, createSchema.parse(await request.json())));
});