import { ok, routeHandler } from "@/server/api";
import { enforcePublicRateLimit } from "@/server/public-rate-limit";
import { digitalCertificateService } from "@/server/services/digital-certificate-service";

export const GET = routeHandler(async (request) => {
  enforcePublicRateLimit(request);
  const url = new URL(request.url);
  const response = ok(await digitalCertificateService.verifyPublic(url.searchParams.get("token") ?? undefined, url.searchParams.get("certificateNumber") ?? undefined), { headers: { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
  response.headers.set("Vary", "X-Forwarded-For");
  return response;
});