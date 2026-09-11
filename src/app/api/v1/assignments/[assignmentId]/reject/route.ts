import { z } from "zod";
import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { officerAssignmentService } from "@/server/services/officer-assignment-service";

const schema = z.object({ reason: z.string().min(1).max(1000) });
type Context = { params: Promise<{ assignmentId: string }> };

export const POST = routeHandler(async (request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const { assignmentId } = await (context as Context).params;
  return ok(await officerAssignmentService.reject(principal, assignmentId, schema.parse(await request.json()).reason));
});