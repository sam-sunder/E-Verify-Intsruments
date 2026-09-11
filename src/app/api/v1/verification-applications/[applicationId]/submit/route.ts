import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { verificationApplicationService } from "@/server/services/verification-application-service";

type Context = { params: Promise<{ applicationId: string }> };

export const POST = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const { applicationId } = await (context as Context).params;
  return ok(await verificationApplicationService.submit(principal, applicationId));
});