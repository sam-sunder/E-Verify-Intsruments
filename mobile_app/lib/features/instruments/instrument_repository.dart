import '../../core/network/api_client.dart';

class InstrumentModel {
  final String publicInstrumentId;
  final String instrumentType;
  final String category;
  final String? manufacturer;
  final String? model;
  final String serialNumber;
  final String? registrationNumber;
  final String? capacity;
  final String? unitOfMeasure;
  final String? currentLocation;
  final String status;
  final bool isActive;
  final String createdAt;
  final String registeredAt;
  final String? lastVerifiedAt;
  final String? nextDueDate;
  final String? remarks;
  final String currentOwnerName;

  InstrumentModel({
    required this.publicInstrumentId,
    required this.instrumentType,
    required this.category,
    this.manufacturer,
    this.model,
    required this.serialNumber,
    this.registrationNumber,
    this.capacity,
    this.unitOfMeasure,
    this.currentLocation,
    required this.status,
    required this.isActive,
    required this.createdAt,
    required this.registeredAt,
    this.lastVerifiedAt,
    this.nextDueDate,
    this.remarks,
    required this.currentOwnerName,
  });

  factory InstrumentModel.fromJson(Map<String, dynamic> json) {
    return InstrumentModel(
      publicInstrumentId: json['publicInstrumentId'],
      instrumentType: json['instrumentType'],
      category: json['category'],
      manufacturer: json['manufacturer'],
      model: json['model'],
      serialNumber: json['serialNumber'],
      registrationNumber: json['registrationNumber'],
      capacity: json['capacity'],
      unitOfMeasure: json['unitOfMeasure'],
      currentLocation: json['currentLocation'],
      status: json['status'],
      isActive: json['isActive'],
      createdAt: json['createdAt'],
      registeredAt: json['registeredAt'],
      lastVerifiedAt: json['lastVerifiedAt'],
      nextDueDate: json['nextDueDate'],
      remarks: json['remarks'],
      currentOwnerName: json['currentOwnerName'],
    );
  }
}

class InstrumentHistoryModel {
  final List<OwnershipChange> ownership;
  final List<LocationChange> locations;
  final List<VerificationSummary> verifications;
  final List<CertificateSummary> certificates;
  final List<ComplianceSummary> compliance;
  final List<EnforcementCase> enforcement;
  final List<AuditLog> audit;

  InstrumentHistoryModel({
    required this.ownership,
    required this.locations,
    required this.verifications,
    required this.certificates,
    required this.compliance,
    required this.enforcement,
    required this.audit,
  });

  factory InstrumentHistoryModel.fromJson(Map<String, dynamic> json) {
    return InstrumentHistoryModel(
      ownership: (json['ownership'] as List).map((e) => OwnershipChange.fromJson(e)).toList(),
      locations: (json['locations'] as List).map((e) => LocationChange.fromJson(e)).toList(),
      verifications: (json['verifications'] as List).map((e) => VerificationSummary.fromJson(e)).toList(),
      certificates: (json['certificates'] as List).map((e) => CertificateSummary.fromJson(e)).toList(),
      compliance: (json['compliance'] as List).map((e) => ComplianceSummary.fromJson(e)).toList(),
      enforcement: (json['enforcement'] as List).map((e) => EnforcementCase.fromJson(e)).toList(),
      audit: (json['audit'] as List).map((e) => AuditLog.fromJson(e)).toList(),
    );
  }
}

class OwnershipChange {
  final Map<String, dynamic>? previousOwner;
  final Map<String, dynamic>? newOwner;
  final String effectiveFrom;
  final String? effectiveTo;
  final String? reason;
  final Map<String, dynamic>? approvedBy;
  final String createdAt;

  OwnershipChange({this.previousOwner, this.newOwner, required this.effectiveFrom, this.effectiveTo, this.reason, this.approvedBy, required this.createdAt});
  factory OwnershipChange.fromJson(Map<String, dynamic> json) => OwnershipChange(
    previousOwner: json['previousOwner'],
    newOwner: json['newOwner'],
    effectiveFrom: json['effectiveFrom'],
    effectiveTo: json['effectiveTo'],
    reason: json['reason'],
    approvedBy: json['approvedBy'],
    createdAt: json['createdAt'],
  );
}

class LocationChange {
  final String? previousLocation;
  final String? newLocation;
  final String effectiveFrom;
  final String? effectiveTo;
  final String? reason;
  final Map<String, dynamic>? approvedBy;
  final String createdAt;

  LocationChange({this.previousLocation, this.newLocation, required this.effectiveFrom, this.effectiveTo, this.reason, this.approvedBy, required this.createdAt});
  factory LocationChange.fromJson(Map<String, dynamic> json) => LocationChange(
    previousLocation: json['previousLocation'],
    newLocation: json['newLocation'],
    effectiveFrom: json['effectiveFrom'],
    effectiveTo: json['effectiveTo'],
    reason: json['reason'],
    approvedBy: json['approvedBy'],
    createdAt: json['createdAt'],
  );
}

class VerificationSummary {
  final String verificationDate;
  final String resultStatus;
  final String? findingsSummary;
  final bool? isCompliant;
  final bool? certificateEligible;

  VerificationSummary({required this.verificationDate, required this.resultStatus, this.findingsSummary, this.isCompliant, this.certificateEligible});
  factory VerificationSummary.fromJson(Map<String, dynamic> json) => VerificationSummary(
    verificationDate: json['verificationDate'],
    resultStatus: json['resultStatus'],
    findingsSummary: json['findingsSummary'],
    isCompliant: json['isCompliant'],
    certificateEligible: json['certificateEligible'],
  );
}

class CertificateSummary {
  final String certificateNumber;
  final String issuedAt;
  final String validFrom;
  final String validTo;
  final String status;

  CertificateSummary({required this.certificateNumber, required this.issuedAt, required this.validFrom, required this.validTo, required this.status});
  factory CertificateSummary.fromJson(Map<String, dynamic> json) => CertificateSummary(
    certificateNumber: json['certificateNumber'],
    issuedAt: json['issuedAt'],
    validFrom: json['validFrom'],
    validTo: json['validTo'],
    status: json['status'],
  );
}

class ComplianceSummary {
  final String assessmentDate;
  final String complianceStatus;
  final double? riskScore;
  final String? riskLevel;
  final String summary;
  final String? recommendedAction;

  ComplianceSummary({required this.assessmentDate, required this.complianceStatus, this.riskScore, this.riskLevel, required this.summary, this.recommendedAction});
  factory ComplianceSummary.fromJson(Map<String, dynamic> json) => ComplianceSummary(
    assessmentDate: json['assessmentDate'],
    complianceStatus: json['complianceStatus'],
    riskScore: (json['riskScore'] as num?)?.toDouble(),
    riskLevel: json['riskLevel'],
    summary: json['summary'],
    recommendedAction: json['recommendedAction'],
  );
}

class EnforcementCase {
  final String caseNumber;
  final String caseType;
  final String? severity;
  final String initiatedAt;
  final String reason;
  final String? actionTaken;
  final String status;
  final String? resolvedAt;

  EnforcementCase({required this.caseNumber, required this.caseType, this.severity, required this.initiatedAt, required this.reason, this.actionTaken, required this.status, this.resolvedAt});
  factory EnforcementCase.fromJson(Map<String, dynamic> json) => EnforcementCase(
    caseNumber: json['caseNumber'],
    caseType: json['caseType'],
    severity: json['severity'],
    initiatedAt: json['initiatedAt'],
    reason: json['reason'],
    actionTaken: json['actionTaken'],
    status: json['status'],
    resolvedAt: json['resolvedAt'],
  );
}

class AuditLog {
  final String actionType;
  final String? oldValue;
  final String? newValue;
  final String changedAt;
  final String? notes;

  AuditLog({required this.actionType, this.oldValue, this.newValue, required this.changedAt, this.notes});
  factory AuditLog.fromJson(Map<String, dynamic> json) => AuditLog(
    actionType: json['actionType'],
    oldValue: json['oldValue'],
    newValue: json['newValue'],
    changedAt: json['changedAt'],
    notes: json['notes'],
  );
}

class InstrumentRepository {
  final ApiClient _apiClient;

  InstrumentRepository(this._apiClient);

  Future<List<InstrumentModel>> listInstruments(Map<String, String>? params) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/instruments',
      method: 'GET',
      queryParams: params,
    );
    final data = response['data'] as List;
    return data.map((json) => InstrumentModel.fromJson(json)).toList();
  }

  Future<InstrumentModel> getInstrument(String publicInstrumentId) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/instruments/$publicInstrumentId',
      method: 'GET',
    );
    return InstrumentModel.fromJson(response);
  }

  Future<InstrumentModel> createInstrument(Map<String, dynamic> data) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/instruments',
      method: 'POST',
      body: data,
    );
    return InstrumentModel.fromJson(response);
  }

  Future<InstrumentHistoryModel> getInstrumentHistory(String publicInstrumentId) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/instruments/$publicInstrumentId/history',
      method: 'GET',
    );
    return InstrumentHistoryModel.fromJson(response);
  }
}
