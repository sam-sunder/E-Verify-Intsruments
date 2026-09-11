import { CertificateStatus } from "@prisma/client";
import { z } from "zod";
import { ok, paged, pagination, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { digitalCertificateService } from "@/server/services/digital-certificate-service";

export const GET = routeHandler(async (request) => {
  const principal = await currentPrincipal(); requireActive(principal);
  const url = new URL(request.url); const { page, pageSize, skip } = pagination(request);
  const status = url.searchParams.get("status");
  const result = await digitalCertificateService.list(principal, { status: status ? z.nativeEnum(CertificateStatus).parse(status) : undefined, instrumentId: url.searchParams.get("instrumentId") ?? undefined, query: url.searchParams.get("query") ?? undefined }, skip, pageSize);
  return ok(paged(result.certificates, page, pageSize, result.total));
});