import { describe, expect, it } from "vitest";
import { ApiError } from "../api";
import { calculateMeasurement } from "./field-verification-service";

describe("field verification measurement calculation", () => {
  it("calculates exact decimal error and inclusive tolerance", () => {
    expect(calculateMeasurement({ standardValue: "0.1", measuredValue: "0.3", tolerance: "0.2" })).toEqual({ calculatedError: "0.2", passFail: true });
    expect(calculateMeasurement({ standardValue: "10", measuredValue: "10.01", tolerance: "0.005" })).toEqual({ calculatedError: "0.01", passFail: false });
  });

  it("rejects invalid decimal strings", () => {
    expect(() => calculateMeasurement({ standardValue: "not-a-number", measuredValue: "1" })).toThrow(ApiError);
  });
});