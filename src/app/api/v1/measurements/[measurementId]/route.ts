import { z } from "zod";
import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { fieldVerificationService } from "@/server/services/field-verification-service";

const schema = z.object({ measurementType: z.string().min(1).max(100).optional(), parameterName: z.string().min(1).max(200).optional(), standardValue: z.string().nullable().optional(), measuredValue: z.string().min(1).optional(), unit: z.string().max(50).nullable().optional(), tolerance: z.string().nullable().optional(), standardReference: z.string().max(500).nullable().optional() }).refine((value) => Object.keys(value).length > 0);
type Context = { params: Promise<{ measurementId: string }> };

export const PATCH = routeHandler(async (request, context) => {
  const principal = await currentPrincipal(); requireActive(principal);
  const { measurementId } = await (context as Context).params;
  return ok(await fieldVerificationService.updateMeasurement(principal, measurementId, schema.parse(await request.json())));
});

export const DELETE = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal(); requireActive(principal);
  const { measurementId } = await (context as Context).params;
  return ok(await fieldVerificationService.deleteMeasurement(principal, measurementId));
});