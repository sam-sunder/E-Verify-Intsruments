import { UserRole } from "@prisma/client";
import { ApiError } from "./api";
import type { Principal } from "./auth";

export function requireRole(principal: Principal, roles: UserRole[]) {
  if (!roles.includes(principal.role)) throw new ApiError(403, "FORBIDDEN", "You do not have permission for this operation");
}

export function requireActive(principal: Principal) {
  if (principal.status !== "ACTIVE") throw new ApiError(403, "ACCOUNT_INACTIVE", "This account is not active");
}

export function requireOwnerOrAdmin(principal: Principal, ownerId: string) {
  if (principal.role !== "ADMINISTRATOR" && (principal.role !== "BUSINESS_OWNER" || principal.userId !== ownerId)) {
    throw new ApiError(403, "FORBIDDEN", "You do not own this resource");
  }
}