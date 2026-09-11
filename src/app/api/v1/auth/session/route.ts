import { ok, routeHandler } from "@/server/api";
import { currentPrincipal } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { userSelect } from "@/server/repositories/user-repository";
import { requireActive } from "@/server/policy";

export const GET = routeHandler(async () => {
  const principal = await currentPrincipal();
  requireActive(principal);
  const user = await prisma.user.findUnique({ where: { id: principal.userId }, select: userSelect });
  return ok({ authenticated: Boolean(user), user });
});