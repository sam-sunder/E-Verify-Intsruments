import { z } from "zod";
import { created, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { digitalCertificateService } from "@/server/services/digital-certificate-service";

const schema = z.object({ validFrom: z.coerce.date().optional(), validTo: z.coerce.date(), documentHash: z.string().max(500).optional() });
type Context = { params: Promise<{ verificationId: string }> };

export const POST = routeHandler(async (request, context) => {
  const principal = await currentPrincipal(); requireActive(principal);
  const { verificationId } = await (context as Context).params;
  return created(await digitalCertificateService.issue(principal, verificationId, schema.parse(await request.json())));
});