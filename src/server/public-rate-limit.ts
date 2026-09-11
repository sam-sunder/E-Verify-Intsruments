import { ApiError } from "./api";

const requests = new Map<string, { startedAt: number; count: number }>();
const windowMs = 60_000;
const maxRequests = 30;

export function enforcePublicRateLimit(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const current = requests.get(key);
  if (!current || now - current.startedAt >= windowMs) {
    requests.set(key, { startedAt: now, count: 1 });
    return;
  }
  current.count += 1;
  if (current.count > maxRequests) throw new ApiError(429, "RATE_LIMITED", "Too many verification requests");
}