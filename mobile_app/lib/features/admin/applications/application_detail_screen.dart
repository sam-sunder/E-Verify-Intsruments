import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/api_client.dart';
import '../../features/applications/application_repository.dart';

class ApplicationDetailScreen extends StatefulWidget {
  final String applicationNumber;
  const ApplicationDetailScreen({super.key, required this.applicationNumber});

  @override
  State<ApplicationDetailScreen> createState() => _ApplicationDetailScreenState();
}

class _ApplicationDetailScreenState extends State<ApplicationDetailScreen> {
  late ApplicationRepository _repository;
  ApplicationModel? _application;
  bool _isLoading = true;
  String? _errorMessage;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _repository = ApplicationRepository(context.read<ApiClient>());
    _loadApplication();
  }

  Future<void> _loadApplication() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      _application = await _repository.getApplication(widget.applicationNumber);
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleAction(Future<void> Function() action, String label) async {
    setState(() => _isProcessing = true);
    try {
      await action();
      await _loadApplication();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$label successful')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Action failed: ${e.toString()}')),
      );
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  Future<void> _promptReason(String actionLabel, Future<void> Function(String) onConfirm) async {
    final controller = TextEditingController();
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('$actionLabel Reason'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Enter reason'),
          maxLines: 3,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              onConfirm(controller.text.trim());
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Review: ${widget.applicationNumber}')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_errorMessage != null) return Center(child: Text(_errorMessage!));
    if (_application == null) return const Center(child: Text('Application not found'));

    final app = _application!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSection('Application', [
            _buildRow('Number', app.applicationNumber),
            _buildRow('Type', app.applicationType),
            _buildRow('Status', app.status),
            _buildRow('Submitted At', app.submittedAt.substring(0, 10)),
          ]),
          const SizedBox(height: 24),
          _buildSection('Instrument', [
            _buildRow('Serial Number', app.instrument.serialNumber),
            _buildRow('Type', app.instrument.instrumentType),
            _buildRow('Category', app.instrument.category),
          ]),
          const SizedBox(height: 24),
          _buildSection('Applicant', [
            _buildRow('Name', app.submittedByName),
            _buildRow('Reviewed By', app.reviewedByName ?? 'Not yet reviewed'),
          ]),
          const SizedBox(height: 24),
          _buildSection('Details', [
            _buildRow('Remarks', app.remarks ?? 'None'),
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
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.teal)),
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

  Widget _buildActionButtons() {
    if (_isProcessing) return const Center(child: CircularProgressIndicator());

    final status = _application!.status;
    final List<Widget> buttons = [];

    if (status == 'SUBMITTED') {
      buttons.add(_buildButton('Start Review', Colors.teal, () => _handleAction(() => _repository.startReview(widget.applicationNumber), 'Review started')));
    } else if (status == 'UNDER_REVIEW') {
      buttons.add(_buildButton('Approve Application', Colors.green, () => _handleAction(() => _repository.approveApplication(widget.applicationNumber), 'Approved')));
      buttons.add(_buildButton('Reject Application', Colors.red, () => _promptReason('Reject', (reason) => _handleAction(() => _repository.rejectApplication(widget.applicationNumber, reason), 'Rejected'))));
    }

    if (status != 'CERTIFICATE_ISSUED' && status != 'REJECTED') {
      buttons.add(_buildButton('Cancel Application', Colors.grey, () => _promptReason('Cancel', (reason) => _handleAction(() => _repository.cancelApplication(widget.applicationNumber, reason), 'Cancelled'))));
    }

    return Column(
      children: buttons,
    );
  }

  Widget _buildButton(String label, Color color, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: onTap,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            backgroundColor: color,
            foregroundColor: Colors.white,
          ),
          child: Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ),
      ),
    );
  }
}
