import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { notificationService } from "@/server/services/notification-service";

type Context = { params: Promise<{ notificationId: string }> };

export const POST = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal(); requireActive(principal); const { notificationId } = await (context as Context).params;
  return ok(await notificationService.markRead(principal, notificationId));
});