import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/network/api_client.dart';
import '../../../features/assignments/assignment_repository.dart';
import 'package:e_verify_met_mobile/core/config/theme_colors.dart';

class AssignmentDetailScreen extends StatefulWidget {
  final String assignmentId;
  const AssignmentDetailScreen({super.key, required this.assignmentId});

  @override
  State<AssignmentDetailScreen> createState() => _AssignmentDetailScreenState();
}

class _AssignmentDetailScreenState extends State<AssignmentDetailScreen> {
  late AssignmentRepository _repository;
  AssignmentModel? _assignment;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _repository = AssignmentRepository(context.read<ApiClient>());
    _loadAssignment();
  }

  Future<void> _loadAssignment() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      _assignment = await _repository.getAssignmentDetail(widget.assignmentId);
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Assignment Detail')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_errorMessage != null) return Center(child: Text(_errorMessage!));
    if (_assignment == null) return const Center(child: Text('Assignment not found'));

    final a = _assignment!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSection('Assignment Info', [
            _buildRow('Officer', a.assignedOfficerName),
            _buildRow('Status', a.status),
            _buildRow('Created At', a.createdAt.substring(0, 10)),
            _buildRow('Due Date', a.dueDate ?? 'N/A'),
          ]),
          const SizedBox(height: 24),
          _buildSection('Application', [
            _buildRow('Application No', a.application.applicationNumber),
            _buildRow('App Status', a.application.status),
            _buildRow('App Type', a.application.applicationType),
          ]),
          const SizedBox(height: 24),
          _buildSection('Instrument', [
            _buildRow('Serial Number', a.instrument.serialNumber),
            _buildRow('Type', a.instrument.instrumentType),
            _buildRow('Category', a.instrument.category),
          ]),
          const SizedBox(height: 24),
          if (a.fieldVerification != null)
            _buildSection('Verification Result', [
              _buildRow('Result Status', a.fieldVerification!.resultStatus),
              _buildRow('Verification ID', a.fieldVerification!.id),
            ]),
        ],
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
        ),
      ],
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Expanded(
            child: Text(value, textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}