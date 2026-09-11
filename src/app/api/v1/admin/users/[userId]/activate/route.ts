import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive, requireRole } from "@/server/policy";
import { authService } from "@/server/services/auth-service";

const schema = z.object({ reason: z.string().min(1).max(500).default("Administrative activation") });

export const POST = routeHandler(async (request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  requireRole(principal, [UserRole.ADMINISTRATOR]);
  const { userId } = await (context as { params: Promise<{ userId: string }> }).params;
  return ok(await authService.setManagedUserStatus(principal.userId, userId, UserStatus.ACTIVE, schema.parse(await request.json()).reason));
});