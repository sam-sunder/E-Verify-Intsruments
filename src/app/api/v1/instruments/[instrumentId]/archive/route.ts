import { UserRole } from "@prisma/client";
import { z } from "zod";
import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive, requireRole } from "@/server/policy";
import { instrumentService } from "@/server/services/instrument-service";

const schema = z.object({ reason: z.string().min(1).max(500) });
type Context = { params: Promise<{ instrumentId: string }> };

export const POST = routeHandler(async (request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  requireRole(principal, [UserRole.ADMINISTRATOR]);
  const { instrumentId } = await (context as Context).params;
  return ok(await instrumentService.archive(principal, instrumentId, schema.parse(await request.json()).reason));
});