import { ok, routeHandler } from "@/server/api";
import { bearerTokens, currentRefreshPrincipal, setAuthCookies } from "@/server/auth";
import { issueTokens } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { userSelect } from "@/server/repositories/user-repository";
import { requireActive } from "@/server/policy";

export const POST = routeHandler(async (request) => {
  const principal = await currentRefreshPrincipal();
  requireActive(principal);
  const user = await prisma.user.findUnique({ where: { id: principal.userId }, select: userSelect });
  if (!user) throw new Error("User not found");
  const tokens = await issueTokens(principal);
  const response = ok({ user, ...(request.headers.get("x-client") === "mobile" ? bearerTokens(tokens) : {}) });
  return setAuthCookies(response, tokens);
});