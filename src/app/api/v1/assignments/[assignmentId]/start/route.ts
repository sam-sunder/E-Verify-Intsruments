import { AssignmentStatus } from "@prisma/client";
import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { officerAssignmentService } from "@/server/services/officer-assignment-service";

type Context = { params: Promise<{ assignmentId: string }> };

export const POST = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const { assignmentId } = await (context as Context).params;
  return ok(await officerAssignmentService.transition(principal, assignmentId, [AssignmentStatus.ACCEPTED], AssignmentStatus.IN_PROGRESS, {}, "Assignment started"));
});