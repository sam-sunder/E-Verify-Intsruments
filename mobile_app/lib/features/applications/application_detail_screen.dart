import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/api_client.dart';
import 'application_repository.dart';
import 'package:e_verify_met_mobile/core/config/theme_colors.dart';

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('App: ${widget.applicationNumber}')),
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
          _buildSection('General Information', [
            _buildRow('Type', app.applicationType),
            _buildRow('Status', app.status),
            _buildRow('Submitted At', app.submittedAt.substring(0, 10)),
            _buildRow('Due Date', app.dueDate ?? 'N/A'),
          ]),
          const SizedBox(height: 24),
          _buildSection('Instrument', [
            _buildRow('Type', app.instrument.instrumentType),
            _buildRow('Serial Number', app.instrument.serialNumber),
            _buildRow('Category', app.instrument.category),
          ]),
          const SizedBox(height: 24),
          _buildSection('Details', [
            _buildRow('Submitted By', app.submittedByName),
            _buildRow('Reviewed By', app.reviewedByName ?? 'Pending'),
            _buildRow('Remarks', app.remarks ?? 'None'),
          ]),
          const SizedBox(height: 32),
          if (app.status == 'DRAFT')
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  try {
                    await _repository.submitApplication(app.applicationNumber);
                    _loadApplication();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Application submitted successfully')),
                    );
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Submission failed: ${e.toString()}')),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                child: const Text('Submit Draft'),
              ),
            ),
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