import { z } from "zod";
import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { complianceService } from "@/server/services/compliance-service";

const schema = z.object({ summary: z.string().min(1).max(5000), recommendedAction: z.string().max(2000).optional() });
type Context = { params: Promise<{ instrumentId: string }> };

export const GET = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal(); requireActive(principal); const { instrumentId } = await (context as Context).params;
  return ok(await complianceService.history(principal, instrumentId));
});

export const POST = routeHandler(async (request, context) => {
  const principal = await currentPrincipal(); requireActive(principal); const { instrumentId } = await (context as Context).params;
  return ok(await complianceService.assess(principal, instrumentId, schema.parse(await request.json())));
});