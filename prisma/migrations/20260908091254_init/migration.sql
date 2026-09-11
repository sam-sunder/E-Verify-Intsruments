-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
);

-- CreateTable
CREATE TABLE "Instrument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "digitalInstrumentId" TEXT NOT NULL,
    "instrumentType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "capacity" TEXT,
    "unitOfMeasure" TEXT,
    "currentOwnerId" TEXT NOT NULL,
    "currentLocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" DATETIME,
    "nextDueDate" DATETIME,
    "remarks" TEXT,
    CONSTRAINT "Instrument_currentOwnerId_fkey" FOREIGN KEY ("currentOwnerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationNumber" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "applicationType" TEXT NOT NULL DEFAULT 'INITIAL_VERIFICATION',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "dueDate" DATETIME,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VerificationApplication_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VerificationApplication_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VerificationApplication_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfficerAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "assignedOfficerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfficerAssignment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "VerificationApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OfficerAssignment_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OfficerAssignment_assignedOfficerId_fkey" FOREIGN KEY ("assignedOfficerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FieldVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "verifiedByUserId" TEXT NOT NULL,
    "verificationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultStatus" TEXT NOT NULL,
    "findingsSummary" TEXT,
    "isCompliant" BOOLEAN,
    "recommendedAction" TEXT,
    "certificateEligible" BOOLEAN DEFAULT false,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FieldVerification_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "OfficerAssignment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FieldVerification_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "VerificationApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FieldVerification_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FieldVerification_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeasurementRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "verificationId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "measurementType" TEXT NOT NULL,
    "parameterName" TEXT NOT NULL,
    "measuredValue" TEXT NOT NULL,
    "unit" TEXT,
    "tolerance" TEXT,
    "standardReference" TEXT,
    "passFail" BOOLEAN NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeasurementRecord_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "FieldVerification" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvidencePhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "verificationId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageKey" TEXT,
    "photoType" TEXT NOT NULL,
    "caption" TEXT,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPrimaryEvidence" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvidencePhoto_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "FieldVerification" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DigitalCertificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "certificateNumber" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "issuedByUserId" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "qrCodeToken" TEXT NOT NULL,
    "documentHash" TEXT,
    "replacementOfCertificateId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "revocationReason" TEXT,
    CONSTRAINT "DigitalCertificate_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DigitalCertificate_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "VerificationApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DigitalCertificate_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "FieldVerification" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DigitalCertificate_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DigitalCertificate_replacementOfCertificateId_fkey" FOREIGN KEY ("replacementOfCertificateId") REFERENCES "DigitalCertificate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CertificateStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "certificateId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "effectiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CertificateStatusHistory_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "DigitalCertificate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CertificateStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentId" TEXT NOT NULL,
    "assessmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "complianceStatus" TEXT NOT NULL,
    "riskScore" INTEGER,
    "riskLevel" TEXT,
    "summary" TEXT NOT NULL,
    "recommendedAction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplianceRecord_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnforcementRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "severity" TEXT,
    "initiatedByUserId" TEXT NOT NULL,
    "initiatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "actionTaken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EnforcementRecord_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EnforcementRecord_initiatedByUserId_fkey" FOREIGN KEY ("initiatedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientUserId" TEXT NOT NULL,
    "instrumentId" TEXT,
    "applicationId" TEXT,
    "assignmentId" TEXT,
    "verificationId" TEXT,
    "certificateId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'IN_APP',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    CONSTRAINT "Notification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "VerificationApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "OfficerAssignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "FieldVerification" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "DigitalCertificate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT,
    "instrumentId" TEXT,
    "applicationId" TEXT,
    "assignmentId" TEXT,
    "verificationId" TEXT,
    "certificateId" TEXT,
    "actionType" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "correlationId" TEXT,
    CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "VerificationApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "OfficerAssignment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "FieldVerification" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "DigitalCertificate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstrumentOwnershipHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentId" TEXT NOT NULL,
    "previousOwnerId" TEXT,
    "newOwnerId" TEXT,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" DATETIME,
    "reason" TEXT,
    "approvedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstrumentOwnershipHistory_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstrumentOwnershipHistory_previousOwnerId_fkey" FOREIGN KEY ("previousOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InstrumentOwnershipHistory_newOwnerId_fkey" FOREIGN KEY ("newOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InstrumentOwnershipHistory_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstrumentLocationHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentId" TEXT NOT NULL,
    "previousLocation" TEXT,
    "newLocation" TEXT,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" DATETIME,
    "reason" TEXT,
    "approvedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstrumentLocationHistory_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstrumentLocationHistory_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Instrument_digitalInstrumentId_key" ON "Instrument"("digitalInstrumentId");

-- CreateIndex
CREATE UNIQUE INDEX "Instrument_serialNumber_key" ON "Instrument"("serialNumber");

-- CreateIndex
CREATE INDEX "Instrument_currentOwnerId_idx" ON "Instrument"("currentOwnerId");

-- CreateIndex
CREATE INDEX "Instrument_status_idx" ON "Instrument"("status");

-- CreateIndex
CREATE INDEX "Instrument_instrumentType_idx" ON "Instrument"("instrumentType");

-- CreateIndex
CREATE INDEX "Instrument_currentLocation_idx" ON "Instrument"("currentLocation");

-- CreateIndex
CREATE INDEX "Instrument_nextDueDate_idx" ON "Instrument"("nextDueDate");

-- CreateIndex
CREATE INDEX "Instrument_registeredAt_idx" ON "Instrument"("registeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationApplication_applicationNumber_key" ON "VerificationApplication"("applicationNumber");

-- CreateIndex
CREATE INDEX "VerificationApplication_instrumentId_idx" ON "VerificationApplication"("instrumentId");

-- CreateIndex
CREATE INDEX "VerificationApplication_submittedByUserId_idx" ON "VerificationApplication"("submittedByUserId");

-- CreateIndex
CREATE INDEX "VerificationApplication_status_idx" ON "VerificationApplication"("status");

-- CreateIndex
CREATE INDEX "VerificationApplication_applicationType_idx" ON "VerificationApplication"("applicationType");

-- CreateIndex
CREATE INDEX "VerificationApplication_applicationNumber_idx" ON "VerificationApplication"("applicationNumber");

-- CreateIndex
CREATE INDEX "OfficerAssignment_applicationId_idx" ON "OfficerAssignment"("applicationId");

-- CreateIndex
CREATE INDEX "OfficerAssignment_instrumentId_idx" ON "OfficerAssignment"("instrumentId");

-- CreateIndex
CREATE INDEX "OfficerAssignment_assignedOfficerId_idx" ON "OfficerAssignment"("assignedOfficerId");

-- CreateIndex
CREATE INDEX "OfficerAssignment_status_idx" ON "OfficerAssignment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FieldVerification_assignmentId_key" ON "FieldVerification"("assignmentId");

-- CreateIndex
CREATE INDEX "FieldVerification_assignmentId_idx" ON "FieldVerification"("assignmentId");

-- CreateIndex
CREATE INDEX "FieldVerification_applicationId_idx" ON "FieldVerification"("applicationId");

-- CreateIndex
CREATE INDEX "FieldVerification_instrumentId_idx" ON "FieldVerification"("instrumentId");

-- CreateIndex
CREATE INDEX "FieldVerification_verifiedByUserId_idx" ON "FieldVerification"("verifiedByUserId");

-- CreateIndex
CREATE INDEX "FieldVerification_resultStatus_idx" ON "FieldVerification"("resultStatus");

-- CreateIndex
CREATE INDEX "MeasurementRecord_verificationId_idx" ON "MeasurementRecord"("verificationId");

-- CreateIndex
CREATE INDEX "MeasurementRecord_instrumentId_idx" ON "MeasurementRecord"("instrumentId");

-- CreateIndex
CREATE INDEX "MeasurementRecord_measurementType_idx" ON "MeasurementRecord"("measurementType");

-- CreateIndex
CREATE INDEX "MeasurementRecord_recordedAt_idx" ON "MeasurementRecord"("recordedAt");

-- CreateIndex
CREATE INDEX "EvidencePhoto_verificationId_idx" ON "EvidencePhoto"("verificationId");

-- CreateIndex
CREATE INDEX "EvidencePhoto_instrumentId_idx" ON "EvidencePhoto"("instrumentId");

-- CreateIndex
CREATE INDEX "EvidencePhoto_photoType_idx" ON "EvidencePhoto"("photoType");

-- CreateIndex
CREATE INDEX "EvidencePhoto_capturedAt_idx" ON "EvidencePhoto"("capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalCertificate_certificateNumber_key" ON "DigitalCertificate"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalCertificate_verificationId_key" ON "DigitalCertificate"("verificationId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalCertificate_qrCodeToken_key" ON "DigitalCertificate"("qrCodeToken");

-- CreateIndex
CREATE INDEX "DigitalCertificate_instrumentId_idx" ON "DigitalCertificate"("instrumentId");

-- CreateIndex
CREATE INDEX "DigitalCertificate_applicationId_idx" ON "DigitalCertificate"("applicationId");

-- CreateIndex
CREATE INDEX "DigitalCertificate_issuedByUserId_idx" ON "DigitalCertificate"("issuedByUserId");

-- CreateIndex
CREATE INDEX "DigitalCertificate_status_idx" ON "DigitalCertificate"("status");

-- CreateIndex
CREATE INDEX "DigitalCertificate_validTo_idx" ON "DigitalCertificate"("validTo");

-- CreateIndex
CREATE INDEX "DigitalCertificate_certificateNumber_idx" ON "DigitalCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "CertificateStatusHistory_certificateId_idx" ON "CertificateStatusHistory"("certificateId");

-- CreateIndex
CREATE INDEX "CertificateStatusHistory_newStatus_idx" ON "CertificateStatusHistory"("newStatus");

-- CreateIndex
CREATE INDEX "CertificateStatusHistory_effectiveAt_idx" ON "CertificateStatusHistory"("effectiveAt");

-- CreateIndex
CREATE INDEX "ComplianceRecord_instrumentId_idx" ON "ComplianceRecord"("instrumentId");

-- CreateIndex
CREATE INDEX "ComplianceRecord_complianceStatus_idx" ON "ComplianceRecord"("complianceStatus");

-- CreateIndex
CREATE INDEX "ComplianceRecord_riskLevel_idx" ON "ComplianceRecord"("riskLevel");

-- CreateIndex
CREATE INDEX "ComplianceRecord_assessmentDate_idx" ON "ComplianceRecord"("assessmentDate");

-- CreateIndex
CREATE UNIQUE INDEX "EnforcementRecord_caseNumber_key" ON "EnforcementRecord"("caseNumber");

-- CreateIndex
CREATE INDEX "EnforcementRecord_instrumentId_idx" ON "EnforcementRecord"("instrumentId");

-- CreateIndex
CREATE INDEX "EnforcementRecord_status_idx" ON "EnforcementRecord"("status");

-- CreateIndex
CREATE INDEX "EnforcementRecord_initiatedAt_idx" ON "EnforcementRecord"("initiatedAt");

-- CreateIndex
CREATE INDEX "EnforcementRecord_initiatedByUserId_idx" ON "EnforcementRecord"("initiatedByUserId");

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_idx" ON "Notification"("recipientUserId");

-- CreateIndex
CREATE INDEX "Notification_instrumentId_idx" ON "Notification"("instrumentId");

-- CreateIndex
CREATE INDEX "Notification_applicationId_idx" ON "Notification"("applicationId");

-- CreateIndex
CREATE INDEX "Notification_assignmentId_idx" ON "Notification"("assignmentId");

-- CreateIndex
CREATE INDEX "Notification_verificationId_idx" ON "Notification"("verificationId");

-- CreateIndex
CREATE INDEX "Notification_certificateId_idx" ON "Notification"("certificateId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_instrumentId_idx" ON "AuditLog"("instrumentId");

-- CreateIndex
CREATE INDEX "AuditLog_applicationId_idx" ON "AuditLog"("applicationId");

-- CreateIndex
CREATE INDEX "AuditLog_assignmentId_idx" ON "AuditLog"("assignmentId");

-- CreateIndex
CREATE INDEX "AuditLog_verificationId_idx" ON "AuditLog"("verificationId");

-- CreateIndex
CREATE INDEX "AuditLog_certificateId_idx" ON "AuditLog"("certificateId");

-- CreateIndex
CREATE INDEX "AuditLog_changedAt_idx" ON "AuditLog"("changedAt");

-- CreateIndex
CREATE INDEX "InstrumentOwnershipHistory_instrumentId_idx" ON "InstrumentOwnershipHistory"("instrumentId");

-- CreateIndex
CREATE INDEX "InstrumentOwnershipHistory_previousOwnerId_idx" ON "InstrumentOwnershipHistory"("previousOwnerId");

-- CreateIndex
CREATE INDEX "InstrumentOwnershipHistory_newOwnerId_idx" ON "InstrumentOwnershipHistory"("newOwnerId");

-- CreateIndex
CREATE INDEX "InstrumentOwnershipHistory_effectiveFrom_idx" ON "InstrumentOwnershipHistory"("effectiveFrom");

-- CreateIndex
CREATE INDEX "InstrumentLocationHistory_instrumentId_idx" ON "InstrumentLocationHistory"("instrumentId");

-- CreateIndex
CREATE INDEX "InstrumentLocationHistory_effectiveFrom_idx" ON "InstrumentLocationHistory"("effectiveFrom");

-- CreateIndex
CREATE INDEX "InstrumentLocationHistory_newLocation_idx" ON "InstrumentLocationHistory"("newLocation");
