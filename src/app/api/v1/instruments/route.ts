import { InstrumentStatus } from "@prisma/client";
import { z } from "zod";
import { created, ok, paged, pagination, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { instrumentService } from "@/server/services/instrument-service";

const createSchema = z.object({
  instrumentType: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  manufacturer: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  serialNumber: z.string().min(1).max(200),
  registrationNumber: z.string().max(200).optional(),
  capacity: z.string().max(100).optional(),
  unitOfMeasure: z.string().max(100).optional(),
  currentOwnerId: z.string().min(1).optional(),
  currentLocation: z.string().max(500).optional(),
  remarks: z.string().max(2000).optional(),
});

export const GET = routeHandler(async (request) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const url = new URL(request.url);
  const { page, pageSize, skip } = pagination(request);
  const status = url.searchParams.get("status");
  const parsedStatus = status ? z.nativeEnum(InstrumentStatus).parse(status) : undefined;
  const result = await instrumentService.list(principal, { query: url.searchParams.get("query") ?? undefined, status: parsedStatus, instrumentType: url.searchParams.get("instrumentType") ?? undefined, category: url.searchParams.get("category") ?? undefined, currentLocation: url.searchParams.get("currentLocation") ?? undefined }, skip, pageSize);
  return ok(paged(result.instruments, page, pageSize, result.total));
});

export const POST = routeHandler(async (request) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  return created(await instrumentService.create(principal, createSchema.parse(await request.json())));
});