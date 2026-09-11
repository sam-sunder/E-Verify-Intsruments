import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { digitalCertificateService } from "@/server/services/digital-certificate-service";

type Context = { params: Promise<{ certificateId: string }> };

export const GET = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal(); requireActive(principal);
  const { certificateId } = await (context as Context).params;
  return ok(await digitalCertificateService.get(principal, certificateId));
});