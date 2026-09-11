import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { fieldVerificationService } from "@/server/services/field-verification-service";

type Context = { params: Promise<{ evidenceId: string }> };

export const DELETE = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal(); requireActive(principal);
  const { evidenceId } = await (context as Context).params;
  return ok(await fieldVerificationService.deleteEvidence(principal, evidenceId));
});