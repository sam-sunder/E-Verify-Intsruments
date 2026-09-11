import { ok, routeHandler } from "@/server/api";
import { clearAuthCookies } from "@/server/auth";

export const POST = routeHandler(async () => clearAuthCookies(ok({ success: true })));