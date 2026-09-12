import 'package:flutter/material.dart';
import 'field_verification_repository.dart';
import '../assignments/assignment_repository.dart';

class FieldVerificationProvider extends ChangeNotifier {
  final FieldVerificationRepository _verificationRepo;
  final AssignmentRepository _assignmentRepo;
  FieldVerificationModel? _verification;
  AssignmentModel? _assignment;
  bool _isFinalized = false;

  // Step 1: Pre-check State
  Map<String, bool> _preCheckStatus = {};
  String? _locationConfirmation;
  String? _serialConfirmation;

  // Step 2: Measurements State
  List<MeasurementModel> _measurements = [];

  // Step 3: Evidence State
  List<EvidencePhotoModel> _evidencePhotos = [];

  // Step 4: Outcome State
  String? _resultStatus;
  String _findingsSummary = '';
  String _remarks = '';
  bool _isCompliant = false;
  bool _certificateEligible = false;

  FieldVerificationProvider(this._verificationRepo, this._assignmentRepo);

  FieldVerificationModel? get verification => _verification;
  AssignmentModel? get assignment => _assignment;
  bool get isFinalized => _isFinalized;
  Map<String, bool> get preCheckStatus => _preCheckStatus;
  String? get locationConfirmation => _locationConfirmation;
  String? get serialConfirmation => _serialConfirmation;
  List<MeasurementModel> get measurements => _measurements;
  List<EvidencePhotoModel> get evidencePhotos => _evidencePhotos;
  String? get resultStatus => _resultStatus;
  String get findingsSummary => _findingsSummary;
  String get remarks => _remarks;
  bool get isCompliant => _isCompliant;
  bool get certificateEligible => _certificateEligible;

  Future<void> loadVerification(String assignmentId) async {
    _verification = await _verificationRepo.getOrCreateVerification(assignmentId);
    _assignment = await _assignmentRepo.getAssignmentDetail(assignmentId);
    _measurements = await _verificationRepo.listMeasurements(_verification!.id);
    _evidencePhotos = _verification!.evidencePhotos;

    // Load existing outcome data if available
    _resultStatus = _verification?.resultStatus;
    _findingsSummary = _verification?.findingsSummary ?? '';
    _remarks = _verification?.remarks ?? '';
    _isCompliant = _verification?.isCompliant ?? false;
    _certificateEligible = _verification?.certificateEligible ?? false;

    _isFinalized = _verification?.status == 'COMPLETED';

    notifyListeners();
  }

  void updatePreCheck(String key, bool value) {
    if (_isFinalized) return;
    _preCheckStatus[key] = value;
    notifyListeners();
  }

  void updateLocationConfirmation(String value) {
    if (_isFinalized) return;
    _locationConfirmation = value;
    notifyListeners();
  }

  void updateSerialConfirmation(String value) {
    if (_isFinalized) return;
    _serialConfirmation = value;
    notifyListeners();
  }

  bool isPreCheckComplete() {
    final requiredKeys = ['visual_condition', 'seal_condition', 'standard_confirmation'];
    if (_locationConfirmation == null || _serialConfirmation == null) return false;
    for (var key in requiredKeys) {
      if (_preCheckStatus[key] != true) return false;
    }
    return true;
  }

  Future<void> addMeasurement(Map<String, dynamic> data) async {
    if (_isFinalized || _verification == null) return;
    final measurement = await _verificationRepo.addMeasurement(_verification!.id, data);
    _measurements.add(measurement);
    notifyListeners();
  }

  void removeMeasurement(int index) {
    if (_isFinalized) return;
    _measurements.removeAt(index);
    notifyListeners();
  }

  Future<void> uploadEvidence({
    required String filePath,
    required String category,
    String? caption,
    bool isPrimary = false,
  }) async {
    if (_isFinalized || _verification == null) return;
    final photo = await _verificationRepo.addEvidence(
      _verification!.id,
      filePath: filePath,
      category: category,
      caption: caption,
      isPrimary: isPrimary,
    );
    _evidencePhotos.add(photo);
    notifyListeners();
  }

  // Outcome State Updates
  void updateResultStatus(String status) {
    if (_isFinalized) return;
    _resultStatus = status;
    notifyListeners();
  }

  void updateFindings(String findings) {
    if (_isFinalized) return;
    _findingsSummary = findings;
    notifyListeners();
  }

  void updateRemarks(String remarks) {
    if (_isFinalized) return;
    _remarks = remarks;
    notifyListeners();
  }

  void updateCompliance(bool value) {
    if (_isFinalized) return;
    _isCompliant = value;
    notifyListeners();
  }

  void updateCertificateEligibility(bool value) {
    if (_isFinalized) return;
    _certificateEligible = value;
    notifyListeners();
  }

  bool isOutcomeComplete() {
    return _resultStatus != null;
  }

  Future<void> submitVerification() async {
    if (_verification == null) throw Exception("No active verification found");

    await _verificationRepo.submitVerification(_verification!.id, {
      'resultStatus': _resultStatus,
      'findingsSummary': _findingsSummary,
      'isCompliant': _isCompliant,
      'certificateEligible': _certificateEligible,
      'remarks': _remarks,
    });

    // Refresh data and mark as finalized
    await loadVerification(_verification!.assignmentId);
    _isFinalized = true;
    notifyListeners();
  }
}
