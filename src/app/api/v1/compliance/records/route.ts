import { ComplianceStatus } from "@prisma/client";
import { z } from "zod";
import { ok, paged, pagination, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { requireActive } from "@/server/policy";
import { complianceService } from "@/server/services/compliance-service";

export const GET = routeHandler(async (request) => {
  const principal = await currentPrincipal(); requireActive(principal);
  const url = new URL(request.url); const { page, pageSize, skip } = pagination(request); const status = url.searchParams.get("complianceStatus");
  const result = await complianceService.list(principal, { instrumentId: url.searchParams.get("instrumentId") ?? undefined, complianceStatus: status ? z.nativeEnum(ComplianceStatus).parse(status) : undefined }, skip, pageSize);
  return ok(paged(result.records, page, pageSize, result.total));
});