import { VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { fieldVerificationService } from "@/server/services/field-verification-service";

const schema = z.object({ resultStatus: z.nativeEnum(VerificationStatus), findingsSummary: z.string().max(5000).optional(), isCompliant: z.boolean().optional(), recommendedAction: z.string().max(2000).optional(), certificateEligible: z.boolean().optional(), remarks: z.string().max(2000).optional() });
type Context = { params: Promise<{ verificationId: string }> };

export const POST = routeHandler(async (request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const { verificationId } = await (context as Context).params;
  return ok(await fieldVerificationService.submit(principal, verificationId, schema.parse(await request.json())));
});