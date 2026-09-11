import { describe, expect, it, vi } from "vitest";
import { CertificateStatus, InstrumentStatus, UserRole } from "@prisma/client";
import { instrumentRepository } from "../repositories/instrument-repository";
import { verificationApplicationRepository } from "../repositories/verification-application-repository";
import { digitalCertificateRepository } from "../repositories/digital-certificate-repository";
import { instrumentService, serialize as serializeInstrument } from "./instrument-service";
import { serialize as serializeApplication } from "./verification-application-service";
import { digitalCertificateService, serialize as serializeCertificate } from "./digital-certificate-service";
import { ApiError } from "../api";

const owner = { userId: "owner-1", role: UserRole.BUSINESS_OWNER, status: "ACTIVE" as const };
const instrument = { digitalInstrumentId: "EVM-INSTRUMENT-1", instrumentType: "Scale", category: "Retail", manufacturer: null, model: null, serialNumber: "S-1", registrationNumber: null, capacity: null, unitOfMeasure: "kg", currentLocation: null, status: InstrumentStatus.ACTIVE, isActive: true, createdAt: new Date(), registeredAt: new Date(), lastVerifiedAt: null, nextDueDate: null, remarks: null, currentOwner: { fullName: "Owner One" }, id: "internal-instrument", currentOwnerId: "owner-1" };

describe("public authenticated resource identifiers", () => {
  it("uses publicInstrumentId for instrument lookup and omits internal id", async () => {
    const lookup = vi.spyOn(instrumentRepository, "findAccessible").mockResolvedValue(instrument as never);
    const result = await instrumentService.get(owner, "EVM-INSTRUMENT-1");
    expect(lookup).toHaveBeenCalledWith(owner, "EVM-INSTRUMENT-1");
    expect(result).not.toHaveProperty("id");
    expect(result.publicInstrumentId).toBe("EVM-INSTRUMENT-1");
    lookup.mockRestore();
  });

  it("uses applicationNumber and certificateNumber without serializing ids", () => {
    const application = serializeApplication({ applicationNumber: "EVM-APP-1", applicationType: "INITIAL_VERIFICATION", status: "DRAFT", submittedAt: new Date(), reviewedAt: null, dueDate: null, remarks: null, createdAt: new Date(), updatedAt: new Date(), instrument: { digitalInstrumentId: "EVM-INSTRUMENT-1", instrumentType: "Scale", category: "Retail", serialNumber: "S-1" }, submittedBy: { fullName: "Owner One" }, reviewedBy: null });
    const certificate = serializeCertificate({ certificateNumber: "EVM-CERT-1", issuedAt: new Date(), validFrom: new Date(), validTo: new Date(Date.now() + 100000), status: CertificateStatus.ACTIVE, qrCodeToken: "random-token", documentHash: null, revokedAt: null, revocationReason: null, instrument: { digitalInstrumentId: "EVM-INSTRUMENT-1", instrumentType: "Scale", category: "Retail", serialNumber: "S-1" }, application: { applicationNumber: "EVM-APP-1", status: "VERIFIED", applicationType: "INITIAL_VERIFICATION" }, verification: { resultStatus: "PASS", verificationDate: new Date(), certificateEligible: true }, issuedBy: { fullName: "Officer" } });
    expect(application).not.toHaveProperty("id");
    expect(certificate).not.toHaveProperty("id");
    expect(application.applicationNumber).toBe("EVM-APP-1");
    expect(certificate.certificateNumber).toBe("EVM-CERT-1");
  });

  it("keeps certificate lookup and ownership authorization at the service boundary", async () => {
    const certificateLookup = vi.spyOn(digitalCertificateRepository, "findAccessible").mockResolvedValue(null);
    await expect(digitalCertificateService.get(owner, "EVM-CERT-1")).rejects.toThrow(ApiError);
    expect(certificateLookup).toHaveBeenCalledWith(owner, "EVM-CERT-1");
    certificateLookup.mockRestore();

    const instrumentLookup = vi.spyOn(instrumentRepository, "findAccessible").mockResolvedValue(instrument as never);
    await expect(instrumentService.update({ ...owner, userId: "different-owner" }, "EVM-INSTRUMENT-1", { remarks: "Nope" })).rejects.toThrow(ApiError);
    instrumentLookup.mockRestore();
  });
});