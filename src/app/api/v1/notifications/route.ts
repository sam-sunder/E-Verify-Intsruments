import { z } from "zod";
import { ok, paged, pagination, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { notificationService } from "@/server/services/notification-service";

export const GET = routeHandler(async (request) => {
  const principal = await currentPrincipal(); requireActive(principal); const url = new URL(request.url); const { page, pageSize, skip } = pagination(request);
  const unreadOnly = z.coerce.boolean().default(false).parse(url.searchParams.get("unreadOnly") ?? false);
  const result = await notificationService.list(principal, unreadOnly, skip, pageSize);
  return ok(paged(result.notifications, page, pageSize, result.total));
});