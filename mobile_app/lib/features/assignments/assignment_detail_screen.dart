import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'assignment_repository.dart';
import '../../core/network/api_client.dart';
import '../field_verification/field_verification_screen.dart';
import '../field_verification/field_verification_provider.dart';
import '../field_verification/field_verification_repository.dart';
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
  bool _isProcessing = false;

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

  Future<void> _handleAction(Future<void> Function() action, String actionName) async {
    setState(() => _isProcessing = true);
    try {
      await action();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$actionName successful')),
      );
      await _loadAssignment();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Action failed: ${e.toString()}')),
      );
    } finally {
      setState(() => _isProcessing = false);
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
          _buildSection('Instrument', [
            _buildDetailRow('Serial Number', a.instrument.serialNumber),
            _buildDetailRow('Type', a.instrument.instrumentType),
            _buildDetailRow('Category', a.instrument.category),
          ]),
          const SizedBox(height: 24),
          _buildSection('Application', [
            _buildDetailRow('Application No', a.application.applicationNumber),
            _buildDetailRow('Status', a.application.status),
            _buildDetailRow('Type', a.application.applicationType),
          ]),
          const SizedBox(height: 24),
          _buildSection('Assignment', [
            _buildDetailRow('Status', a.status),
            _buildDetailRow('Assigned At', a.assignedAt),
            if (a.dueDate != null) _buildDetailRow('Due Date', a.dueDate!),
            _buildDetailRow('Officer', a.assignedOfficerName),
          ]),
          const SizedBox(height: 32),
          _buildActionButtons(),
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
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    if (_isProcessing) return const Center(child: CircularProgressIndicator());

    switch (_assignment!.status) {
      case 'ASSIGNED':
        return SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => _handleAction(() => _repository.acceptAssignment(widget.assignmentId), 'Accept'),
            child: const Text('Accept Assignment'),
          ),
        );
      case 'ACCEPTED':
        return SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => _handleAction(() => _repository.startAssignment(widget.assignmentId), 'Start'),
            child: const Text('Start Verification'),
          ),
        );
      case 'IN_PROGRESS':
        return SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => ChangeNotifierProvider(
                    create: (context) => FieldVerificationProvider(
                      FieldVerificationRepository(context.read<ApiClient>()),
                      AssignmentRepository(context.read<ApiClient>()),
                    ),
                    child: FieldVerificationScreen(assignmentId: widget.assignmentId),
                  ),
                ),
              );
            },
            child: const Text('Continue Verification'),
          ),
        );
      default:
        return const Center(child: Text('No actions available for this state'));
    }
  }
}