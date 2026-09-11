import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { instrumentService } from "@/server/services/instrument-service";

type Context = { params: Promise<{ instrumentId: string }> };

export const GET = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const { instrumentId } = await (context as Context).params;
  return ok(await instrumentService.history(principal, instrumentId));
});