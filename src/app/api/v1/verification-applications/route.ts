import { ApplicationStatus, ApplicationType } from "@prisma/client";
import { z } from "zod";
import { created, ok, paged, pagination, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { verificationApplicationService } from "@/server/services/verification-application-service";

const createSchema = z.object({
  instrumentId: z.string().min(1),
  applicationType: z.nativeEnum(ApplicationType),
  remarks: z.string().max(2000).optional(),
  dueDate: z.coerce.date().optional(),
  previousApplicationId: z.string().min(1).optional(),
  submittedByUserId: z.string().min(1).optional(),
});

export const GET = routeHandler(async (request) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const url = new URL(request.url);
  const { page, pageSize, skip } = pagination(request);
  const status = url.searchParams.get("status");
  const applicationType = url.searchParams.get("applicationType");
  const result = await verificationApplicationService.list(principal, { query: url.searchParams.get("query") ?? undefined, instrumentId: url.searchParams.get("instrumentId") ?? undefined, status: status ? z.nativeEnum(ApplicationStatus).parse(status) : undefined, applicationType: applicationType ? z.nativeEnum(ApplicationType).parse(applicationType) : undefined }, skip, pageSize);
  return ok(paged(result.applications, page, pageSize, result.total));
});

export const POST = routeHandler(async (request) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  return created(await verificationApplicationService.create(principal, createSchema.parse(await request.json())));
});