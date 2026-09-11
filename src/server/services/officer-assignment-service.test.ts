import { describe, expect, it } from "vitest";
import { AssignmentStatus } from "@prisma/client";
import { ApiError } from "../api";
import { requireAssignmentTransition } from "./officer-assignment-service";

describe("officer assignment lifecycle", () => {
  it("allows only explicit lifecycle transitions", () => {
    expect(() => requireAssignmentTransition(AssignmentStatus.ASSIGNED, [AssignmentStatus.ASSIGNED])).not.toThrow();
    expect(() => requireAssignmentTransition(AssignmentStatus.ASSIGNED, [AssignmentStatus.ACCEPTED])).toThrow(ApiError);
    expect(() => requireAssignmentTransition(AssignmentStatus.IN_PROGRESS, [AssignmentStatus.COMPLETED])).toThrow(ApiError);
  });
});