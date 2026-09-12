import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/network/api_client.dart';
import '../../../features/applications/application_repository.dart';
import 'application_detail_screen.dart';

class ApplicationListScreen extends StatefulWidget {
  const ApplicationListScreen({super.key});

  @override
  State<ApplicationListScreen> createState() => _ApplicationListScreenState();
}

class _ApplicationListScreenState extends State<ApplicationListScreen> {
  late ApplicationRepository _repository;
  List<ApplicationModel> _applications = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _statusFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _repository = ApplicationRepository(context.read<ApiClient>());
    _loadApplications();
  }

  Future<void> _loadApplications() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      Map<String, String>? params;
      if (_statusFilter != 'ALL') {
        params = {'status': _statusFilter};
      }
      _applications = await _repository.listApplications(params);
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Application Queue'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (val) {
              setState(() => _statusFilter = val);
              _loadApplications();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'ALL', child: Text('All')),
              const PopupMenuItem(value: 'SUBMITTED', child: Text('Submitted')),
              const PopupMenuItem(value: 'UNDER_REVIEW', child: Text('Under Review')),
              const PopupMenuItem(value: 'ASSIGNED', child: Text('Assigned')),
              const PopupMenuItem(value: 'VERIFIED', child: Text('Verified')),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadApplications,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_errorMessage!),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadApplications, child: const Text('Retry')),
          ],
        ),
      );
    }

    if (_applications.isEmpty) {
      return const Center(child: Text('No applications found.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _applications.length,
      itemBuilder: (context, index) {
        final app = _applications[index];
        return _buildApplicationCard(app);
      },
    );
  }

  Widget _buildApplicationCard(ApplicationModel app) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade300),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Text('App: ${app.applicationNumber}', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text('Instrument: ${app.instrument.serialNumber}'),
            Text('Type: ${app.applicationType}'),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildStatusBadge(app.status),
                const SizedBox(width: 8),
                Text('Submitted: ${app.submittedAt.substring(0, 10)}', style: const TextStyle(fontSize: 12)),
              ],
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => ApplicationDetailScreen(applicationNumber: app.applicationNumber)),
          );
        },
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color = Colors.grey;
    if (status == 'CERTIFICATE_ISSUED' || status == 'VERIFIED') color = Colors.green;
    if (status == 'REJECTED' || status == 'CANCELLED') color = Colors.red;
    if (status == 'UNDER_REVIEW' || status == 'ASSIGNED') color = Colors.orange;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color),
      ),
      child: Text(status, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }
}
