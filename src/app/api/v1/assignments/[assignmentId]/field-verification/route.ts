import { z } from "zod";
import { created, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { fieldVerificationService } from "@/server/services/field-verification-service";

const schema = z.object({ verificationDate: z.coerce.date().optional(), findingsSummary: z.string().max(5000).optional(), remarks: z.string().max(2000).optional() });
type Context = { params: Promise<{ assignmentId: string }> };

export const POST = routeHandler(async (request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const { assignmentId } = await (context as Context).params;
  return created(await fieldVerificationService.create(principal, assignmentId, schema.parse(await request.json())));
});