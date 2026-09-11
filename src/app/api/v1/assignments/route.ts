import { AssignmentStatus } from "@prisma/client";
import { z } from "zod";
import { created, ok, paged, pagination, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { officerAssignmentService } from "@/server/services/officer-assignment-service";

const createSchema = z.object({ applicationId: z.string().min(1), assignedOfficerId: z.string().min(1), dueDate: z.coerce.date().optional(), notes: z.string().max(2000).optional() });

export const GET = routeHandler(async (request) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const url = new URL(request.url);
  const { page, pageSize, skip } = pagination(request);
  const status = url.searchParams.get("status");
  const result = await officerAssignmentService.list(principal, { status: status ? z.nativeEnum(AssignmentStatus).parse(status) : undefined, applicationId: url.searchParams.get("applicationId") ?? undefined, assignedOfficerId: url.searchParams.get("assignedOfficerId") ?? undefined, query: url.searchParams.get("query") ?? undefined }, skip, pageSize);
  return ok(paged(result.assignments, page, pageSize, result.total));
});

export const POST = routeHandler(async (request) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  return created(await officerAssignmentService.create(principal, createSchema.parse(await request.json())));
});