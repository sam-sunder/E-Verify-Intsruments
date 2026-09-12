import '../../core/network/api_client.dart';

class CertificateModel {
  final String certificateNumber;
  final String issuedAt;
  final String validFrom;
  final String validTo;
  final String status;
  final String qrCodeToken;
  final String publicVerificationUrl;
  final String? documentHash;
  final String? revokedAt;
  final String? revocationReason;
  final InstrumentSummary instrument;
  final String applicationNumber;
  final String applicationStatus;
  final String applicationType;
  final String verificationResult;
  final String verificationDate;
  final String issuedByName;

  CertificateModel({
    required this.certificateNumber,
    required this.issuedAt,
    required this.validFrom,
    required this.validTo,
    required this.status,
    required this.qrCodeToken,
    required this.publicVerificationUrl,
    this.documentHash,
    this.revokedAt,
    this.revocationReason,
    required this.instrument,
    required this.applicationNumber,
    required this.applicationStatus,
    required this.applicationType,
    required this.verificationResult,
    required this.verificationDate,
    required this.issuedByName,
  });

  factory CertificateModel.fromJson(Map<String, dynamic> json) {
    return CertificateModel(
      certificateNumber: json['certificateNumber'],
      issuedAt: json['issuedAt'],
      validFrom: json['validFrom'],
      validTo: json['validTo'],
      status: json['status'],
      qrCodeToken: json['qrCodeToken'],
      publicVerificationUrl: json['publicVerificationUrl'],
      documentHash: json['documentHash'],
      revokedAt: json['revokedAt'],
      revocationReason: json['revocationReason'],
      instrument: InstrumentSummary.fromJson(json['instrument']),
      applicationNumber: json['applicationNumber'],
      applicationStatus: json['applicationStatus'],
      applicationType: json['applicationType'],
      verificationResult: json['verificationResult'],
      verificationDate: json['verificationDate'],
      issuedByName: json['issuedByName'],
    );
  }
}

class InstrumentSummary {
  final String publicInstrumentId;
  final String instrumentType;
  final String category;
  final String serialNumber;

  InstrumentSummary({
    required this.publicInstrumentId,
    required this.instrumentType,
    required this.category,
    required this.serialNumber,
  });

  factory InstrumentSummary.fromJson(Map<String, dynamic> json) {
    return InstrumentSummary(
      publicInstrumentId: json['publicInstrumentId'],
      instrumentType: json['instrumentType'],
      category: json['category'],
      serialNumber: json['serialNumber'],
    );
  }
}

class CertificateRepository {
  final ApiClient _apiClient;

  CertificateRepository(this._apiClient);

  Future<List<CertificateModel>> listCertificates(Map<String, String>? params) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/certificates',
      method: 'GET',
      queryParams: params,
    );
    final data = response['data'] as List;
    return data.map((json) => CertificateModel.fromJson(json)).toList();
  }

  Future<CertificateModel> getCertificate(String certificateNumber) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/certificates/$certificateNumber',
      method: 'GET',
    );
    return CertificateModel.fromJson(response);
  }
}
