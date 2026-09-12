import '../../core/network/api_client.dart';
import 'dart:io';

class FieldVerificationRepository {
  final ApiClient _apiClient;

  FieldVerificationRepository(this._apiClient);

  Future<FieldVerificationModel> getOrCreateVerification(String assignmentId) async {
    try {
      return await getVerificationByAssignment(assignmentId);
    } catch (e) {
      return await createVerification(assignmentId);
    }
  }

  Future<FieldVerificationModel> getVerificationByAssignment(String assignmentId) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/assignments/$assignmentId/field-verification',
      method: 'GET',
    );
    return FieldVerificationModel.fromJson(response);
  }

  Future<FieldVerificationModel> createVerification(String assignmentId) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/assignments/$assignmentId/field-verification',
      method: 'POST',
      body: {
        'verificationDate': DateTime.now().toIso8601String(),
        'findingsSummary': '',
        'remarks': '',
      },
    );
    return FieldVerificationModel.fromJson(response);
  }

  Future<FieldVerificationModel> getVerification(String verificationId) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/field-verifications/$verificationId',
      method: 'GET',
    );
    return FieldVerificationModel.fromJson(response);
  }

  Future<MeasurementModel> addMeasurement(String verificationId, Map<String, dynamic> data) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/field-verifications/$verificationId/measurements',
      method: 'POST',
      body: data,
    );
    return MeasurementModel.fromJson(response);
  }

  Future<void> submitVerification(String verificationId, Map<String, dynamic> data) async {
    await _apiClient.request(
      path: '/field-verifications/$verificationId/submit',
      method: 'POST',
      body: data,
    );
  }

  Future<List<MeasurementModel>> listMeasurements(String verificationId) async {
    final response = await _apiClient.request<List<dynamic>>(
      path: '/field-verifications/$verificationId/measurements',
      method: 'GET',
    );
    return response.map((json) => MeasurementModel.fromJson(json)).toList();
  }

  Future<EvidencePhotoModel> addEvidence(String verificationId, {
    required String filePath,
    required String category,
    String? caption,
    bool isPrimary = false,
  }) async {
    final response = await _apiClient.multipartRequest<Map<String, dynamic>>(
      path: '/field-verifications/$verificationId/evidence',
      fields: {
        'photoType': category,
        'caption': caption ?? '',
        'isPrimaryEvidence': isPrimary ? 'true' : 'false',
      },
      files: {
        'file': File(filePath),
      },
    );
    return EvidencePhotoModel.fromJson(response);
  }
}

class FieldVerificationModel {
  final String id;
  final String status;
  final String verificationDate;
  final String? resultStatus;
  final String? findingsSummary;
  final bool? isCompliant;
  final bool? certificateEligible;
  final String? remarks;
  final String assignmentId;
  final List<EvidencePhotoModel> evidencePhotos;

  FieldVerificationModel({
    required this.id,
    required this.status,
    required this.verificationDate,
    this.resultStatus,
    this.findingsSummary,
    this.isCompliant,
    this.certificateEligible,
    this.remarks,
    required this.assignmentId,
    this.evidencePhotos = const [],
  });

  factory FieldVerificationModel.fromJson(Map<String, dynamic> json) {
    return FieldVerificationModel(
      id: json['id'],
      status: json['status'],
      verificationDate: json['verificationDate'],
      resultStatus: json['resultStatus'],
      findingsSummary: json['findingsSummary'],
      isCompliant: json['isCompliant'],
      certificateEligible: json['certificateEligible'],
      remarks: json['remarks'],
      assignmentId: json['assignmentId'],
      evidencePhotos: (json['evidencePhotos'] as List? ?? [])
          .map((e) => EvidencePhotoModel.fromJson(e))
          .toList(),
    );
  }
}

class EvidencePhotoModel {
  final String id;
  final String fileUrl;
  final String photoType;
  final String? caption;
  final String capturedAt;
  final bool isPrimaryEvidence;

  EvidencePhotoModel({
    required this.id,
    required this.fileUrl,
    required this.photoType,
    this.caption,
    required this.capturedAt,
    required this.isPrimaryEvidence,
  });

  factory EvidencePhotoModel.fromJson(Map<String, dynamic> json) {
    return EvidencePhotoModel(
      id: json['id'],
      fileUrl: json['fileUrl'],
      photoType: json['photoType'],
      caption: json['caption'],
      capturedAt: json['capturedAt'],
      isPrimaryEvidence: json['isPrimaryEvidence'] ?? false,
    );
  }
}

class MeasurementModel {
  final String id;
  final String measurementType;
  final String parameterName;
  final String? standardValue;
  final String measuredValue;
  final String? unit;
  final String? tolerance;
  final String? standardReference;
  final String? calculatedError;
  final bool passFail;
  final String recordedAt;

  MeasurementModel({
    required this.id,
    required this.measurementType,
    required this.parameterName,
    this.standardValue,
    required this.measuredValue,
    this.unit,
    this.tolerance,
    this.standardReference,
    this.calculatedError,
    required this.passFail,
    required this.recordedAt,
  });

  factory MeasurementModel.fromJson(Map<String, dynamic> json) {
    return MeasurementModel(
      id: json['id'],
      measurementType: json['measurementType'],
      parameterName: json['parameterName'],
      standardValue: json['standardValue'],
      measuredValue: json['measuredValue'],
      unit: json['unit'],
      tolerance: json['tolerance'],
      standardReference: json['standardReference'],
      calculatedError: json['calculatedError'],
      passFail: json['passFail'] ?? false,
      recordedAt: json['recordedAt'],
    );
  }
}
