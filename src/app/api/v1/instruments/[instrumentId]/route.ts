import { z } from "zod";
import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { instrumentService } from "@/server/services/instrument-service";

const updateSchema = z.object({
  instrumentType: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(100).optional(),
  manufacturer: z.string().max(200).nullable().optional(),
  model: z.string().max(200).nullable().optional(),
  serialNumber: z.string().min(1).max(200).optional(),
  registrationNumber: z.string().max(200).nullable().optional(),
  capacity: z.string().max(100).nullable().optional(),
  unitOfMeasure: z.string().max(100).nullable().optional(),
  currentLocation: z.string().max(500).nullable().optional(),
  remarks: z.string().max(2000).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0);

type Context = { params: Promise<{ instrumentId: string }> };

export const GET = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const { instrumentId } = await (context as Context).params;
  return ok(await instrumentService.get(principal, instrumentId));
});

export const PATCH = routeHandler(async (request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const { instrumentId } = await (context as Context).params;
  return ok(await instrumentService.update(principal, instrumentId, updateSchema.parse(await request.json())));
});