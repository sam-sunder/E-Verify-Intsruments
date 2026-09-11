import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { complianceService } from "@/server/services/compliance-service";

export const GET = routeHandler(async () => {
  const principal = await currentPrincipal(); requireActive(principal);
  return ok(await complianceService.summary(principal));
});