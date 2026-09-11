import { z } from "zod";
import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { userSelect } from "@/server/repositories/user-repository";
import { requireActive } from "@/server/policy";
import { auditService } from "@/server/services/audit-service";

const schema = z.object({ fullName: z.string().min(1).max(200).optional(), phone: z.string().max(40).nullable().optional() }).refine((value) => Object.keys(value).length > 0);

export const GET = routeHandler(async () => {
  const principal = await currentPrincipal();
  requireActive(principal);
  return ok(await prisma.user.findUniqueOrThrow({ where: { id: principal.userId, status: "ACTIVE" }, select: userSelect }));
});

export const PATCH = routeHandler(async (request) => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const user = await prisma.user.update({ where: { id: principal.userId }, data: schema.parse(await request.json()), select: userSelect });
  await auditService.record({ actorUserId: principal.userId, actionType: "UPDATED", notes: "Updated own profile" });
  return ok(user);
});