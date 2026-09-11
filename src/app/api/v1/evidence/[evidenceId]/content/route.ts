import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { fieldVerificationService } from "@/server/services/field-verification-service";

type Context = { params: Promise<{ evidenceId: string }> };

export const GET = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal(); requireActive(principal);
  const { evidenceId } = await (context as Context).params;
  const data = await fieldVerificationService.evidenceContent(principal, evidenceId);
  return new Response(data, { headers: { "Content-Type": "application/octet-stream", "Cache-Control": "private, no-store" } });
});