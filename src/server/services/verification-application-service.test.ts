import { ApplicationStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { ApiError } from "../api";
import { requireApplicationTransition } from "./verification-application-service";

describe("verification application lifecycle", () => {
  it("allows only explicit lifecycle transitions", () => {
    expect(() => requireApplicationTransition(ApplicationStatus.SUBMITTED, [ApplicationStatus.SUBMITTED])).not.toThrow();
    expect(() => requireApplicationTransition(ApplicationStatus.DRAFT, [ApplicationStatus.SUBMITTED])).toThrow(ApiError);
  });

  it("does not introduce an approved application status", () => {
    expect(Object.values(ApplicationStatus)).not.toContain("APPROVED");
  });
});