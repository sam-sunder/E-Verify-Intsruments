import { z } from "zod";
import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { verificationApplicationService } from "@/server/services/verification-application-service";

const updateSchema = z.object({ remarks: z.string().max(2000).nullable().optional(), dueDate: z.coerce.date().nullable().optional() }).refine((value) => Object.keys(value).length > 0);
type Context = { params: Promise<{ applicationId: string }> };

export const GET = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const { applicationId } = await (context as Context).params;
  return ok(await verificationApplicationService.get(principal, applicationId));
});

export const PATCH = routeHandler(async (request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const { applicationId } = await (context as Context).params;
  return ok(await verificationApplicationService.update(principal, applicationId, updateSchema.parse(await request.json())));
});