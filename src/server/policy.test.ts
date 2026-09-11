import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import { ApiError } from "./api";
import { requireOwnerOrAdmin, requireRole } from "./policy";

const owner = { userId: "owner-1", role: UserRole.BUSINESS_OWNER, status: "ACTIVE" as const };

describe("authorization policy", () => {
  it("allows only configured roles", () => {
    expect(() => requireRole(owner, [UserRole.BUSINESS_OWNER])).not.toThrow();
    expect(() => requireRole(owner, [UserRole.ADMINISTRATOR])).toThrow(ApiError);
  });

  it("allows the owner or an administrator", () => {
    expect(() => requireOwnerOrAdmin(owner, "owner-1")).not.toThrow();
    expect(() => requireOwnerOrAdmin({ ...owner, role: UserRole.ADMINISTRATOR }, "other")).not.toThrow();
    expect(() => requireOwnerOrAdmin(owner, "other")).toThrow(ApiError);
  });
});