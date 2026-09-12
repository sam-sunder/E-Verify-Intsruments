import '../../core/network/api_client.dart';

class ApplicationModel {
  final String applicationNumber;
  final String applicationType;
  final String status;
  final String submittedAt;
  final String? reviewedAt;
  final String? dueDate;
  final String? remarks;
  final String createdAt;
  final String updatedAt;
  final InstrumentSummary instrument;
  final String submittedByName;
  final String? reviewedByName;

  ApplicationModel({
    required this.applicationNumber,
    required this.applicationType,
    required this.status,
    required this.submittedAt,
    this.reviewedAt,
    this.dueDate,
    this.remarks,
    required this.createdAt,
    required this.updatedAt,
    required this.instrument,
    required this.submittedByName,
    this.reviewedByName,
  });

  factory ApplicationModel.fromJson(Map<String, dynamic> json) {
    return ApplicationModel(
      applicationNumber: json['applicationNumber'],
      applicationType: json['applicationType'],
      status: json['status'],
      submittedAt: json['submittedAt'],
      reviewedAt: json['reviewedAt'],
      dueDate: json['dueDate'],
      remarks: json['remarks'],
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
      instrument: InstrumentSummary.fromJson(json['instrument']),
      submittedByName: json['submittedByName'],
      reviewedByName: json['reviewedByName'],
    );
  }
}

class InstrumentSummary {
  final String digitalInstrumentId;
  final String instrumentType;
  final String category;
  final String serialNumber;

  InstrumentSummary({
    required this.digitalInstrumentId,
    required this.instrumentType,
    required this.category,
    required this.serialNumber,
  });

  factory InstrumentSummary.fromJson(Map<String, dynamic> json) {
    return InstrumentSummary(
      digitalInstrumentId: json['digitalInstrumentId'],
      instrumentType: json['instrumentType'],
      category: json['category'],
      serialNumber: json['serialNumber'],
    );
  }
}

class ApplicationRepository {
  final ApiClient _apiClient;

  ApplicationRepository(this._apiClient);

  Future<List<ApplicationModel>> listApplications(Map<String, String>? params) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/verification-applications',
      method: 'GET',
      queryParams: params,
    );
    final data = response['data'] as List;
    return data.map((json) => ApplicationModel.fromJson(json)).toList();
  }

  Future<ApplicationModel> getApplication(String applicationNumber) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/verification-applications/$applicationNumber',
      method: 'GET',
    );
    return ApplicationModel.fromJson(response);
  }

  Future<ApplicationModel> createApplication(Map<String, dynamic> data) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/verification-applications',
      method: 'POST',
      body: data,
    );
    return ApplicationModel.fromJson(response);
  }

  Future<ApplicationModel> submitApplication(String applicationNumber) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/verification-applications/$applicationNumber/submit',
      method: 'POST',
    );
    return ApplicationModel.fromJson(response);
  }

  Future<ApplicationModel> startReview(String applicationNumber) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/admin/verification-applications/$applicationNumber/start-review',
      method: 'POST',
    );
    return ApplicationModel.fromJson(response);
  }

  Future<ApplicationModel> approveApplication(String applicationNumber) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/admin/verification-applications/$applicationNumber/approve',
      method: 'POST',
    );
    return ApplicationModel.fromJson(response);
  }

  Future<ApplicationModel> rejectApplication(String applicationNumber, String reason) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/admin/verification-applications/$applicationNumber/reject',
      method: 'POST',
      body: {'reason': reason},
    );
    return ApplicationModel.fromJson(response);
  }

  Future<ApplicationModel> cancelApplication(String applicationNumber, String reason) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/admin/verification-applications/$applicationNumber/cancel',
      method: 'POST',
      body: {'reason': reason},
    );
    return ApplicationModel.fromJson(response);
  }
}
