import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { notificationService } from "@/server/services/notification-service";

export const POST = routeHandler(async () => {
  const principal = await currentPrincipal(); requireActive(principal);
  return ok(await notificationService.markAllRead(principal));
});