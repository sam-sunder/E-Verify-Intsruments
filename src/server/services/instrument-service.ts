import { InstrumentStatus, UserRole, UserStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { ApiError } from "../api";
import type { Principal } from "../auth";
import { requireOwnerOrAdmin, requireRole } from "../policy";
import { userRepository } from "../repositories/user-repository";
import { instrumentRepository } from "../repositories/instrument-repository";
import { auditService } from "./audit-service";

export function serialize(instrument: { digitalInstrumentId: string; instrumentType: string; category: string; manufacturer: string | null; model: string | null; serialNumber: string; registrationNumber: string | null; capacity: string | null; unitOfMeasure: string | null; currentLocation: string | null; status: InstrumentStatus; isActive: boolean; createdAt: Date; registeredAt: Date; lastVerifiedAt: Date | null; nextDueDate: Date | null; remarks: string | null; currentOwner: { fullName: string }; }) {
  return { publicInstrumentId: instrument.digitalInstrumentId, instrumentType: instrument.instrumentType, category: instrument.category, manufacturer: instrument.manufacturer, model: instrument.model, serialNumber: instrument.serialNumber, registrationNumber: instrument.registrationNumber, capacity: instrument.capacity, unitOfMeasure: instrument.unitOfMeasure, currentLocation: instrument.currentLocation, status: instrument.status, isActive: instrument.isActive, createdAt: instrument.createdAt, registeredAt: instrument.registeredAt, lastVerifiedAt: instrument.lastVerifiedAt, nextDueDate: instrument.nextDueDate, remarks: instrument.remarks, currentOwnerName: instrument.currentOwner.fullName };
}

export const instrumentService = {
  async list(principal: Principal, filters: { query?: string; status?: InstrumentStatus; instrumentType?: string; category?: string; currentLocation?: string }, skip: number, take: number) {
    const [instruments, total] = await instrumentRepository.list(principal, filters, skip, take);
    return { instruments: instruments.map(serialize), total };
  },
  async get(principal: Principal, publicInstrumentId: string) {
    const instrument = await instrumentRepository.findAccessible(principal, publicInstrumentId);
    if (!instrument) throw new ApiError(404, "INSTRUMENT_NOT_FOUND", "Instrument not found");
    return serialize(instrument);
  },
  async create(principal: Principal, input: { instrumentType: string; category: string; manufacturer?: string; model?: string; serialNumber: string; registrationNumber?: string; capacity?: string; unitOfMeasure?: string; currentOwnerId?: string; currentLocation?: string; remarks?: string }) {
    requireRole(principal, [UserRole.BUSINESS_OWNER, UserRole.ADMINISTRATOR]);
    const ownerId = input.currentOwnerId ?? principal.userId;
    if (principal.role === UserRole.BUSINESS_OWNER) requireOwnerOrAdmin(principal, ownerId);
    const owner = await userRepository.findById(ownerId);
    if (!owner || owner.role !== UserRole.BUSINESS_OWNER || owner.status !== UserStatus.ACTIVE) throw new ApiError(400, "INVALID_OWNER", "The instrument owner must be an active Business Owner");
    const instrument = await instrumentRepository.create({ ...input, currentOwnerId: ownerId, digitalInstrumentId: `EVM-${randomUUID()}` });
    await auditService.record({ actorUserId: principal.userId, instrumentId: instrument.id, actionType: "CREATED", notes: "Instrument registered" });
    return serialize(instrument);
  },
  async update(principal: Principal, publicInstrumentId: string, input: Parameters<typeof instrumentRepository.update>[1]) {
    const existing = await instrumentRepository.findAccessible(principal, publicInstrumentId);
    if (!existing) throw new ApiError(404, "INSTRUMENT_NOT_FOUND", "Instrument not found");
    requireOwnerOrAdmin(principal, existing.currentOwnerId);
    const instrument = await instrumentRepository.update(publicInstrumentId, input);
    await auditService.record({ actorUserId: principal.userId, instrumentId: instrument.id, actionType: "UPDATED", notes: "Instrument details updated" });
    return serialize(instrument);
  },
  async archive(principal: Principal, publicInstrumentId: string, reason: string) {
    requireRole(principal, [UserRole.ADMINISTRATOR]);
    const existing = await instrumentRepository.findAccessible(principal, publicInstrumentId);
    if (!existing) throw new ApiError(404, "INSTRUMENT_NOT_FOUND", "Instrument not found");
    const instrument = await instrumentRepository.archive(publicInstrumentId);
    await auditService.record({ actorUserId: principal.userId, instrumentId: instrument.id, actionType: "UPDATED", notes: `Instrument archived: ${reason}` });
    return serialize(instrument);
  },
  async history(principal: Principal, publicInstrumentId: string) {
    const history = await instrumentRepository.history(principal, publicInstrumentId);
    if (!history) throw new ApiError(404, "INSTRUMENT_NOT_FOUND", "Instrument not found");
    return {
      ownership: history.ownershipHistory,
      locations: history.locationHistory,
      verifications: history.fieldVerifications,
      certificates: history.certificates,
      compliance: history.complianceRecords,
      enforcement: principal.role === UserRole.ADMINISTRATOR ? history.enforcementRecords : [],
      audit: history.auditLogs,
    };
  },
};