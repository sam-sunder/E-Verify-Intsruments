import { describe, expect, it } from "vitest";
import { certificateExpiryState } from "./compliance-service";

describe("certificate validity monitoring", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const afterDays = (days: number) => new Date(now.getTime() + days * 86_400_000);

  it("derives the approved expiry bands", () => {
    expect(certificateExpiryState(afterDays(91), now)).toBe("VALID");
    expect(certificateExpiryState(afterDays(90), now)).toBe("UPCOMING");
    expect(certificateExpiryState(afterDays(30), now)).toBe("UPCOMING");
    expect(certificateExpiryState(afterDays(29), now)).toBe("DUE_SOON");
    expect(certificateExpiryState(afterDays(7), now)).toBe("DUE_SOON");
    expect(certificateExpiryState(afterDays(6), now)).toBe("CRITICAL");
    expect(certificateExpiryState(afterDays(-1), now)).toBe("EXPIRED");
  });
});