import { describe, expect, it } from "vitest";
import { CertificateStatus } from "@prisma/client";
import { ApiError } from "../api";
import { requireStatusTransition } from "./digital-certificate-service";

describe("digital certificate lifecycle", () => {
  it("allows active certificates to be suspended or revoked", () => {
    expect(() => requireStatusTransition(CertificateStatus.ACTIVE, CertificateStatus.SUSPENDED)).not.toThrow();
    expect(() => requireStatusTransition(CertificateStatus.ACTIVE, CertificateStatus.REVOKED)).not.toThrow();
  });

  it("rejects reopening a revoked certificate", () => {
    expect(() => requireStatusTransition(CertificateStatus.REVOKED, CertificateStatus.ACTIVE)).toThrow(ApiError);
  });
});