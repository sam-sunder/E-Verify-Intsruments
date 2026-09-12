import '../../core/network/api_client.dart';

class AssignmentModel {
  final String id;
  final String status;
  final String assignedAt;
  final String? acceptedAt;
  final String? dueDate;
  final String? completedAt;
  final String? notes;
  final String createdAt;
  final String updatedAt;
  final ApplicationSummary application;
  final InstrumentSummary instrument;
  final String assignedOfficerName;
  final FieldVerificationSummary? fieldVerification;

  AssignmentModel({
    required this.id,
    required this.status,
    required this.assignedAt,
    this.acceptedAt,
    this.dueDate,
    this.completedAt,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    required this.application,
    required this.instrument,
    required this.assignedOfficerName,
    this.fieldVerification,
  });

  factory AssignmentModel.fromJson(Map<String, dynamic> json) {
    return AssignmentModel(
      id: json['id'],
      status: json['status'],
      assignedAt: json['assignedAt'],
      acceptedAt: json['acceptedAt'],
      dueDate: json['dueDate'],
      completedAt: json['completedAt'],
      notes: json['notes'],
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
      application: ApplicationSummary.fromJson(json['application']),
      instrument: InstrumentSummary.fromJson(json['instrument']),
      assignedOfficerName: json['assignedOfficerName'],
      fieldVerification: json['fieldVerification'] != null
          ? FieldVerificationSummary.fromJson(json['fieldVerification'])
          : null,
    );
  }
}

class ApplicationSummary {
  final String applicationNumber;
  final String status;
  final String applicationType;

  ApplicationSummary({
    required this.applicationNumber,
    required this.status,
    required this.applicationType,
  });

  factory ApplicationSummary.fromJson(Map<String, dynamic> json) {
    return ApplicationSummary(
      applicationNumber: json['applicationNumber'],
      status: json['status'],
      applicationType: json['applicationType'],
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

class FieldVerificationSummary {
  final String id;
  final String resultStatus;

  FieldVerificationSummary({
    required this.id,
    required this.resultStatus,
  });

  factory FieldVerificationSummary.fromJson(Map<String, dynamic> json) {
    return FieldVerificationSummary(
      id: json['id'],
      resultStatus: json['resultStatus'],
    );
  }
}

class AssignmentRepository {
  final ApiClient _apiClient;

  AssignmentRepository(this._apiClient);

  Future<List<AssignmentModel>> getAssignments({String? status}) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/assignments',
      method: 'GET',
      queryParams: status != null ? {'status': status} : null,
    );

    final data = response['data'] as List;
    return data.map((json) => AssignmentModel.fromJson(json)).toList();
  }

  Future<Map<String, int>> getDashboardStats() async {
    final all = await getAssignments();
    return {
      'PENDING': all.where((a) => a.status == 'ASSIGNED').length,
      'ACCEPTED': all.where((a) => a.status == 'ACCEPTED').length,
      'IN_PROGRESS': all.where((a) => a.status == 'IN_PROGRESS').length,
      'COMPLETED': all.where((a) => a.status == 'COMPLETED').length,
    };
  }

  Future<AssignmentModel?> getInProgressAssignment() async {
    final all = await getAssignments(status: 'IN_PROGRESS');
    return all.isNotEmpty ? all.first : null;
  }

  Future<AssignmentModel> getAssignmentDetail(String id) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/assignments/$id',
      method: 'GET',
    );

    return AssignmentModel.fromJson(response);
  }

  Future<void> acceptAssignment(String id) async {
    await _apiClient.request(
      path: '/assignments/$id/accept',
      method: 'POST',
    );
  }

  Future<void> startAssignment(String id) async {
    await _apiClient.request(
      path: '/assignments/$id/start',
      method: 'POST',
    );
  }
}
