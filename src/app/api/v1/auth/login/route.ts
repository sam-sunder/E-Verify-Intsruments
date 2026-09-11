import { z } from "zod";
import { created, errorResponse, routeHandler } from "@/server/api";
import { bearerTokens, setAuthCookies } from "@/server/auth";
import { authService } from "@/server/services/auth-service";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const POST = routeHandler(async (request) => {
  try {
    const input = schema.parse(await request.json());
    const result = await authService.login(input.email, input.password);
    const response = created({ user: await result.user, ...(request.headers.get("x-client") === "mobile" ? bearerTokens(result.tokens) : {}) });
    return setAuthCookies(response, result.tokens);
  } catch (error) {
    return errorResponse(error);
  }
});