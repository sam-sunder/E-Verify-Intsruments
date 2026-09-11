import { z } from "zod";
import { created, ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { fieldVerificationService } from "@/server/services/field-verification-service";

const metadata = z.object({ photoType: z.string().min(1).max(100), caption: z.string().max(1000).optional(), capturedAt: z.coerce.date().optional(), isPrimaryEvidence: z.coerce.boolean().optional() });
type Context = { params: Promise<{ verificationId: string }> };

export const GET = routeHandler(async (_request, context) => {
  const principal = await currentPrincipal(); requireActive(principal);
  const { verificationId } = await (context as Context).params;
  return ok(await fieldVerificationService.listEvidence(principal, verificationId));
});

export const POST = routeHandler(async (request, context) => {
  const principal = await currentPrincipal(); requireActive(principal);
  const { verificationId } = await (context as Context).params;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new z.ZodError([{ code: "custom", path: ["file"], message: "An image file is required" }]);
  const parsed = metadata.parse({ photoType: form.get("photoType"), caption: form.get("caption") ?? undefined, capturedAt: form.get("capturedAt") ?? undefined, isPrimaryEvidence: form.get("isPrimaryEvidence") ?? undefined });
  return created(await fieldVerificationService.uploadEvidence(principal, verificationId, { fileName: file.name, fileSize: file.size, contentType: file.type, fileData: new Uint8Array(await file.arrayBuffer()), ...parsed }));
});