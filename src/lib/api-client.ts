export type ApiError = { code: string; message: string; details?: unknown };
export type ApiResult<T> = { data: T };

let mobileAccessToken: string | null = null;

export function setMobileAccessToken(token: string | null) { mobileAccessToken = token; }

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (mobileAccessToken) headers.set("Authorization", `Bearer ${mobileAccessToken}`);
  const response = await fetch(`/api/v1${path}`, { ...init, headers, credentials: "include" });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login?session_expired=true";
    }
    throw new Error("Session expired. Please sign in again.");
  }

  const body = await response.json().catch(() => null) as ApiResult<T> | { error?: ApiError } | null;
  if (!response.ok) throw new Error((body && "error" in body && body.error?.message) || "The request could not be completed");
  return (body as ApiResult<T>).data;
}

export type UserRole = "BUSINESS_OWNER" | "OFFICER" | "ADMINISTRATOR";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type UserProfile = { id: string; email: string; fullName: string; phone: string | null; role: UserRole; status: UserStatus };
export type PublicCertificate = { valid: boolean; certificateNumber: string; status: string; validFrom: string; validTo: string; instrument: { publicInstrumentId: string; instrumentType: string; category: string } };

export type Pagination = { page: number; pageSize: number; totalItems: number; totalPages: number };
export type PagedResult<T> = { data: T[]; pagination: Pagination };

export type InstrumentStatus = "ACTIVE" | "INACTIVE" | "EXPIRED" | "SUSPENDED" | "REVOKED" | "ARCHIVED";

export type Instrument = {
  publicInstrumentId: string;
  instrumentType: string;
  category: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string;
  registrationNumber: string | null;
  capacity: string | null;
  unitOfMeasure: string | null;
  currentLocation: string | null;
  status: InstrumentStatus;
  isActive: boolean;
  createdAt: string;
  registeredAt: string;
  lastVerifiedAt: string | null;
  nextDueDate: string | null;
  remarks: string | null;
  currentOwnerName: string;
};

export type InstrumentHistory = {
  ownership: Array<{
    previousOwner: { fullName: string } | null;
    newOwner: { fullName: string } | null;
    effectiveFrom: string;
    effectiveTo: string | null;
    reason: string | null;
    approvedBy: { fullName: string } | null;
    createdAt: string;
  }>;
  locations: Array<{
    previousLocation: string | null;
    newLocation: string | null;
    effectiveFrom: string;
    effectiveTo: string | null;
    reason: string | null;
    approvedBy: { fullName: string } | null;
    createdAt: string;
  }>;
  verifications: Array<{
    verificationDate: string;
    resultStatus: string;
    findingsSummary: string | null;
    isCompliant: boolean | null;
    certificateEligible: boolean | null;
  }>;
  certificates: Array<{
    certificateNumber: string;
    issuedAt: string;
    validFrom: string;
    validTo: string;
    status: CertificateStatus;
  }>;
  compliance: Array<{
    assessmentDate: string;
    complianceStatus: string;
    riskScore: number | null;
    riskLevel: string | null;
    summary: string;
    recommendedAction: string | null;
  }>;
  enforcement: Array<{
    caseNumber: string;
    caseType: string;
    severity: string | null;
    initiatedAt: string;
    reason: string;
    actionTaken: string | null;
    status: string;
    resolvedAt: string | null;
  }>;
  audit: Array<{
    actionType: string;
    oldValue: string | null;
    newValue: string | null;
    changedAt: string;
    notes: string | null;
  }>;
};

export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSIGNED"
  | "VERIFIED"
  | "REJECTED"
  | "CERTIFICATE_ISSUED"
  | "CANCELLED"
  | "REVERIFICATION_REQUESTED";

export type ApplicationType =
  | "INITIAL_VERIFICATION"
  | "RE_VERIFICATION"
  | "REPLACEMENT_REQUEST"
  | "COMPLIANCE_REVIEW";

export type VerificationApplication = {
  applicationNumber: string;
  applicationType: ApplicationType;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt: string | null;
  dueDate: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  instrument: {
    digitalInstrumentId: string;
    instrumentType: string;
    category: string;
    serialNumber: string;
  };
  submittedByName: string;
  reviewedByName: string | null;
};

export type CertificateStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPENDED" | "REPLACED" | "VOID";

export type DigitalCertificate = {
  certificateNumber: string;
  issuedAt: string;
  validFrom: string;
  validTo: string;
  status: CertificateStatus;
  qrCodeToken: string;
  publicVerificationUrl: string;
  documentHash: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  instrument: {
    publicInstrumentId: string;
    instrumentType: string;
    category: string;
    serialNumber: string;
  };
  applicationNumber: string;
  applicationStatus: string;
  applicationType: string;
  verificationResult: string;
  verificationDate: string;
  issuedByName: string;
};

export type CertificateStatusHistoryItem = {
  previousStatus: CertificateStatus | null;
  newStatus: CertificateStatus;
  effectiveAt: string;
  reason: string | null;
  notes: string | null;
  createdAt: string;
};

export type ExpiryState = "VALID" | "UPCOMING" | "DUE_SOON" | "CRITICAL" | "EXPIRED";

export type ComplianceSummary = {
  totals: Record<ExpiryState, number>;
  certificates: Array<{
    certificateNumber: string;
    instrumentId: string;
    state: ExpiryState;
    complianceStatus: string;
    validTo: string;
    certificateStatus: CertificateStatus;
  }>;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  instrument: { digitalInstrumentId: string } | null;
  certificate: { certificateNumber: string } | null;
};

export type AssignmentStatus = "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "REJECTED";
export type VerificationStatus = "PASS" | "FAIL" | "CONDITIONAL" | "REVERIFICATION_REQUIRED" | "REJECTED" | "NOT_ELIGIBLE";

export type OfficerAssignment = {
  id: string;
  status: AssignmentStatus;
  assignedAt: string;
  acceptedAt: string | null;
  dueDate: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  application: { applicationNumber: string; status: ApplicationStatus; applicationType: string };
  instrument: { digitalInstrumentId: string; instrumentType: string; category: string; serialNumber: string };
  assignedOfficerName: string;
  fieldVerification?: { id: string; resultStatus: string } | null;
};

export type MeasurementRecord = {
  id: string;
  measurementType: string;
  parameterName: string;
  standardValue: string | null;
  measuredValue: string;
  unit: string | null;
  tolerance: string | null;
  standardReference: string | null;
  calculatedError: string | null;
  passFail: boolean;
  recordedAt: string;
  createdAt: string;
};

export type EvidencePhoto = {
  id: string;
  fileUrl: string;
  photoType: string;
  caption: string | null;
  capturedAt: string;
  isPrimaryEvidence: boolean;
  createdAt: string;
};

export type FieldVerification = {
  id: string;
  status: string;
  verificationDate: string;
  resultStatus: VerificationStatus | null;
  findingsSummary: string | null;
  isCompliant: boolean | null;
  recommendedAction: string | null;
  certificateEligible: boolean | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  assignmentId: string;
  assignment: {
    status: AssignmentStatus;
    assignedOfficerId: string;
    applicationId: string;
    instrumentId: string;
    application: { applicationNumber: string; status: ApplicationStatus; instrumentId: string };
    instrument: { digitalInstrumentId: string; serialNumber: string; instrumentType: string };
  };
  measurements: MeasurementRecord[];
  evidencePhotos: EvidencePhoto[];
};

function toQueryString(params?: Record<string, string | number | boolean | undefined | null>) {
  if (!params) return "";
  const filtered = Object.entries(params).filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined && entry[1] !== null && entry[1] !== "");
  if (filtered.length === 0) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of filtered) sp.set(k, String(v));
  return `?${sp.toString()}`;
}

export const api = {
  session: () => apiRequest<{ authenticated: boolean; user: UserProfile | null }>("/auth/session"),
  getMe: () => apiRequest<UserProfile>("/me"),
  login: (email: string, password: string) => apiRequest<{ user: UserProfile; accessToken?: string; refreshToken?: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => apiRequest<{ success: boolean }>("/auth/logout", { method: "POST" }),
  updateProfile: (input: { fullName?: string; phone?: string | null }) => apiRequest<UserProfile>("/me", { method: "PATCH", body: JSON.stringify(input) }),
  changePassword: (input: { currentPassword: string; newPassword: string }) => apiRequest<{ success: boolean }>("/me/password", { method: "POST", body: JSON.stringify(input) }),
  verifyCertificate: (input: { token?: string; certificateNumber?: string }) => apiRequest<PublicCertificate>(`/public/certificates/verify?${new URLSearchParams(Object.entries(input).filter((entry): entry is [string, string] => typeof entry[1] === "string"))}`),

  // Instruments
  listInstruments: (params?: { query?: string; status?: InstrumentStatus; instrumentType?: string; category?: string; currentLocation?: string; page?: number; pageSize?: number }) =>
    apiRequest<PagedResult<Instrument>>(`/instruments${toQueryString(params)}`),
  getInstrument: (publicInstrumentId: string) =>
    apiRequest<Instrument>(`/instruments/${encodeURIComponent(publicInstrumentId)}`),
  createInstrument: (input: { instrumentType: string; category: string; manufacturer?: string; model?: string; serialNumber: string; registrationNumber?: string; capacity?: string; unitOfMeasure?: string; currentLocation?: string; remarks?: string }) =>
    apiRequest<Instrument>("/instruments", { method: "POST", body: JSON.stringify(input) }),
  updateInstrument: (publicInstrumentId: string, input: { instrumentType?: string; category?: string; manufacturer?: string | null; model?: string | null; serialNumber?: string; registrationNumber?: string | null; capacity?: string | null; unitOfMeasure?: string | null; currentLocation?: string | null; remarks?: string | null }) =>
    apiRequest<Instrument>(`/instruments/${encodeURIComponent(publicInstrumentId)}`, { method: "PATCH", body: JSON.stringify(input) }),
  getInstrumentHistory: (publicInstrumentId: string) =>
    apiRequest<InstrumentHistory>(`/instruments/${encodeURIComponent(publicInstrumentId)}/history`),

  // Verification Applications
  listApplications: (params?: { query?: string; instrumentId?: string; status?: ApplicationStatus; applicationType?: ApplicationType; page?: number; pageSize?: number }) =>
    apiRequest<PagedResult<VerificationApplication>>(`/verification-applications${toQueryString(params)}`),
  getApplication: (applicationNumber: string) =>
    apiRequest<VerificationApplication>(`/verification-applications/${encodeURIComponent(applicationNumber)}`),
  createApplication: (input: { instrumentId: string; applicationType: ApplicationType; remarks?: string; dueDate?: string; previousApplicationId?: string }) =>
    apiRequest<VerificationApplication>("/verification-applications", { method: "POST", body: JSON.stringify(input) }),
  updateApplication: (applicationNumber: string, input: { remarks?: string | null; dueDate?: string | null }) =>
    apiRequest<VerificationApplication>(`/verification-applications/${encodeURIComponent(applicationNumber)}`, { method: "PATCH", body: JSON.stringify(input) }),
  submitApplication: (applicationNumber: string) =>
    apiRequest<VerificationApplication>(`/verification-applications/${encodeURIComponent(applicationNumber)}/submit`, { method: "POST" }),

  // Digital Certificates
  listCertificates: (params?: { query?: string; status?: CertificateStatus; instrumentId?: string; page?: number; pageSize?: number }) =>
    apiRequest<PagedResult<DigitalCertificate>>(`/certificates${toQueryString(params)}`),
  getCertificate: (certificateNumber: string) =>
    apiRequest<DigitalCertificate>(`/certificates/${encodeURIComponent(certificateNumber)}`),
  getCertificateHistory: (certificateNumber: string) =>
    apiRequest<CertificateStatusHistoryItem[]>(`/certificates/${encodeURIComponent(certificateNumber)}/status-history`),
  issueCertificate: (input: { verificationId: string; validTo: string; validFrom?: string; documentHash?: string }) =>
    apiRequest<DigitalCertificate>("/certificates/issue", { method: "POST", body: JSON.stringify(input) }),

  // Compliance
  getComplianceSummary: () =>
    apiRequest<ComplianceSummary>("/compliance/summary"),

  // Notifications
  listNotifications: (params?: { unreadOnly?: boolean; page?: number; pageSize?: number }) =>
    apiRequest<PagedResult<NotificationItem>>(`/notifications${toQueryString(params)}`),
  markNotificationRead: (notificationId: string) =>
    apiRequest<{ success: boolean }>(`/notifications/${encodeURIComponent(notificationId)}/read`, { method: "POST" }),
  markAllNotificationsRead: () =>
    apiRequest<{ success: boolean; count: number }>("/notifications/read-all", { method: "POST" }),

  // Administrator
  listUsers: (params?: { query?: string; role?: UserRole; status?: UserStatus; page?: number; pageSize?: number }) =>
    apiRequest<PagedResult<UserProfile>>(`/admin/users${toQueryString(params)}`),
  getUser: (userId: string) =>
    apiRequest<UserProfile>(`/admin/users/${encodeURIComponent(userId)}`),
  createUser: (input: { email: string; fullName: string; role: UserRole; phone?: string | null }) =>
    apiRequest<UserProfile>("/admin/users", { method: "POST", body: JSON.stringify(input) }),
  updateUser: (userId: string, input: Partial<{ email: string; fullName: string; role: UserRole; phone: string | null }>) =>
    apiRequest<UserProfile>(`/admin/users/${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify(input) }),
  activateUser: (userId: string) =>
    apiRequest<{ success: boolean }>(`/admin/users/${encodeURIComponent(userId)}/activate`, { method: "POST" }),
  deactivateUser: (userId: string) =>
    apiRequest<{ success: boolean }>(`/admin/users/${encodeURIComponent(userId)}/deactivate`, { method: "POST" }),
  startApplicationReview: (applicationId: string) =>
    apiRequest<VerificationApplication>(`/admin/verification-applications/${encodeURIComponent(applicationId)}/start-review`, { method: "POST" }),
  approveApplication: (applicationId: string) =>
    apiRequest<VerificationApplication>(`/admin/verification-applications/${encodeURIComponent(applicationId)}/approve`, { method: "POST" }),
  rejectApplication: (applicationId: string, input: { reason: string }) =>
    apiRequest<VerificationApplication>(`/admin/verification-applications/${encodeURIComponent(applicationId)}/reject`, { method: "POST", body: JSON.stringify(input) }),
  cancelApplication: (applicationId: string, input: { reason: string }) =>
    apiRequest<VerificationApplication>(`/admin/verification-applications/${encodeURIComponent(applicationId)}/cancel`, { method: "POST", body: JSON.stringify(input) }),
  revokeCertificate: (certificateId: string, input: { reason: string }) =>
    apiRequest<{ success: boolean }>(`/certificates/${encodeURIComponent(certificateId)}/revoke`, { method: "POST", body: JSON.stringify(input) }),
  suspendCertificate: (certificateId: string, input: { reason: string }) =>
    apiRequest<{ success: boolean }>(`/certificates/${encodeURIComponent(certificateId)}/suspend`, { method: "POST", body: JSON.stringify(input) }),

  // Officer Workflow
  listAssignments: (params?: { status?: AssignmentStatus; applicationId?: string; assignedOfficerId?: string; query?: string; page?: number; pageSize?: number }) =>
    apiRequest<PagedResult<OfficerAssignment>>(`/assignments${toQueryString(params)}`),
  getAssignment: (assignmentId: string) =>
    apiRequest<OfficerAssignment>(`/assignments/${encodeURIComponent(assignmentId)}`),
  acceptAssignment: (assignmentId: string) =>
    apiRequest<OfficerAssignment>(`/assignments/${encodeURIComponent(assignmentId)}/accept`, { method: "POST" }),
  startAssignment: (assignmentId: string) =>
    apiRequest<OfficerAssignment>(`/assignments/${encodeURIComponent(assignmentId)}/start`, { method: "POST" }),
  getAssignmentVerification: (assignmentId: string) =>
    apiRequest<FieldVerification>(`/assignments/${encodeURIComponent(assignmentId)}/field-verification`),
  createAssignmentVerification: (assignmentId: string, input: { verificationDate?: string; findingsSummary?: string; remarks?: string }) =>
    apiRequest<FieldVerification>(`/assignments/${encodeURIComponent(assignmentId)}/field-verification`, { method: "POST", body: JSON.stringify(input) }),
  getVerification: (verificationId: string) =>
    apiRequest<FieldVerification>(`/field-verifications/${encodeURIComponent(verificationId)}`),
  getVerificationByApplication: (applicationNumber: string) =>
    apiRequest<FieldVerification>(`/field-verifications/application/${encodeURIComponent(applicationNumber)}`),
  addMeasurement: (verificationId: string, input: { measurementType: string; parameterName: string; standardValue?: string; measuredValue: string; unit?: string; tolerance?: string; standardReference?: string }) =>
    apiRequest<MeasurementRecord>(`/field-verifications/${encodeURIComponent(verificationId)}/measurements`, { method: "POST", body: JSON.stringify(input) }),
  listMeasurements: (verificationId: string) =>
    apiRequest<MeasurementRecord[]>(`/field-verifications/${encodeURIComponent(verificationId)}/measurements`),
  addEvidence: (verificationId: string, input: FormData) =>
    apiRequest<EvidencePhoto>(`/field-verifications/${encodeURIComponent(verificationId)}/evidence`, { method: "POST", body: input, headers: new Headers() }), // FormData will automatically set content-type
  submitVerification: (verificationId: string, input: { resultStatus: VerificationStatus; findingsSummary?: string; isCompliant?: boolean; recommendedAction?: string; certificateEligible?: boolean; remarks?: string }) =>
    apiRequest<FieldVerification>(`/field-verifications/${encodeURIComponent(verificationId)}/submit`, { method: "POST", body: JSON.stringify(input) })
};