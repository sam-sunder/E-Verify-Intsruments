import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { fieldVerificationService } from "@/server/services/field-verification-service";

type Context = { params: Promise<{ verificationId: string }> };

export const GET = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const { verificationId } = await (context as Context).params;
  return ok(await fieldVerificationService.get(principal, verificationId));
});