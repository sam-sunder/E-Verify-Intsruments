import { cookies } from "next/headers";
import { headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { ApiError } from "./api";
import { UserRole, UserStatus } from "@prisma/client";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "development-only-change-me");
const accessCookie = "e_verify_access";
const refreshCookie = "e_verify_refresh";

export type Principal = { userId: string; role: UserRole; status: UserStatus };

async function sign(principal: Principal, type: "access" | "refresh") {
  return new SignJWT({ role: principal.role, status: principal.status, type })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(principal.userId)
    .setIssuedAt()
    .setExpirationTime(type === "access" ? "15m" : "30d")
    .sign(secret);
}

export async function issueTokens(principal: Principal) {
  return { accessToken: await sign(principal, "access"), refreshToken: await sign(principal, "refresh") };
}

export async function readPrincipal(token: string | undefined, expectedType: "access" | "refresh" = "access") {
  if (!token) throw new ApiError(401, "UNAUTHENTICATED", "Authentication is required");
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.type !== expectedType || typeof payload.sub !== "string") throw new Error("invalid token");
    return { userId: payload.sub, role: payload.role as UserRole, status: payload.status as UserStatus };
  } catch {
    throw new ApiError(401, "INVALID_SESSION", "The session is invalid or expired");
  }
}

export async function currentPrincipal() {
  const header = (await headers()).get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (bearer) return readPrincipal(bearer);
  return readPrincipal((await cookies()).get(accessCookie)?.value);
}

export async function currentRefreshPrincipal() {
  return readPrincipal((await cookies()).get(refreshCookie)?.value, "refresh");
}

export function setAuthCookies(response: Response, tokens: { accessToken: string; refreshToken: string }) {
  // For cross-origin cookies, SameSite=None and Secure=true are required
  const cookieOptions = "Path=/; HttpOnly; SameSite=None; Secure";
  response.headers.append("Set-Cookie", `${accessCookie}=${tokens.accessToken}; ${cookieOptions}; Max-Age=900`);
  response.headers.append("Set-Cookie", `${refreshCookie}=${tokens.refreshToken}; ${cookieOptions}; Max-Age=2592000`);
  return response;
}

export function clearAuthCookies(response: Response) {
  response.headers.append("Set-Cookie", `${accessCookie}=; Path=/; HttpOnly; Max-Age=0`);
  response.headers.append("Set-Cookie", `${refreshCookie}=; Path=/; HttpOnly; Max-Age=0`);
  return response;
}

export function bearerTokens(tokens: { accessToken: string; refreshToken: string }) {
  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}