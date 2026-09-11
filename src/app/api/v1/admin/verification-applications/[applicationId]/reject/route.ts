import { UserRole } from "@prisma/client";
import { z } from "zod";
import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive, requireRole } from "@/server/policy";
import { verificationApplicationService } from "@/server/services/verification-application-service";

const schema = z.object({ reason: z.string().min(1).max(1000) });
type Context = { params: Promise<{ applicationId: string }> };

export const POST = routeHandler(async (request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  requireRole(principal, [UserRole.ADMINISTRATOR]);
  const { applicationId } = await (context as Context).params;
  return ok(await verificationApplicationService.reject(principal, applicationId, schema.parse(await request.json()).reason));
});