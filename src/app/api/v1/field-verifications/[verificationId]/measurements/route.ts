import { z } from "zod";
import { created, ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { fieldVerificationService } from "@/server/services/field-verification-service";
import { fieldVerificationRepository } from "@/server/repositories/field-verification-repository";

const schema = z.object({ measurementType: z.string().min(1).max(100), parameterName: z.string().min(1).max(200), standardValue: z.string().optional(), measuredValue: z.string().min(1), unit: z.string().max(50).optional(), tolerance: z.string().optional(), standardReference: z.string().max(500).optional() });
type Context = { params: Promise<{ verificationId: string }> };

export const GET = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal(); requireActive(principal);
  const { verificationId } = await (context as Context).params;
  await fieldVerificationService.get(principal, verificationId);
  return ok(await fieldVerificationRepository.listMeasurements(verificationId));
});

export const POST = routeHandler(async (request, context) => {
  const principal = await currentPrincipal(); requireActive(principal);
  const { verificationId } = await (context as Context).params;
  return created(await fieldVerificationService.addMeasurement(principal, verificationId, schema.parse(await request.json())));
});