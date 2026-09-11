import { z } from "zod";
import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { digitalCertificateService } from "@/server/services/digital-certificate-service";

const schema = z.object({ reason: z.string().min(1).max(1000) });
type Context = { params: Promise<{ certificateId: string }> };

export const POST = routeHandler(async (request, context) => {
  const principal = await currentPrincipal(); requireActive(principal);
  const { certificateId } = await (context as Context).params;
  return ok(await digitalCertificateService.changeStatus(principal, certificateId, "SUSPENDED", schema.parse(await request.json()).reason));
});