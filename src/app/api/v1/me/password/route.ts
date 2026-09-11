import { z } from "zod";
import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { authService } from "@/server/services/auth-service";

const schema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(12).max(200) });

export const POST = routeHandler(async (request) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const input = schema.parse(await request.json());
  await authService.changePassword(principal.userId, input.currentPassword, input.newPassword);
  return ok({ success: true });
});