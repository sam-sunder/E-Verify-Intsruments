import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/network/api_client.dart';
import '../../../features/instruments/instrument_repository.dart';
import '../../../features/applications/application_repository.dart';
import '../../../features/assignments/assignment_repository.dart';
import '../../../features/certificates/certificate_repository.dart';
import '../applications/application_list_screen.dart';
import '../assignments/assignment_list_screen.dart';
import 'package:e_verify_met_mobile/core/config/theme_colors.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late InstrumentRepository _instrumentRepo;
  late ApplicationRepository _applicationRepo;
  late AssignmentRepository _assignmentRepo;
  late CertificateRepository _certificateRepo;

  Map<String, int> _stats = {};
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    final client = context.read<ApiClient>();
    _instrumentRepo = InstrumentRepository(client);
    _applicationRepo = ApplicationRepository(client);
    _assignmentRepo = AssignmentRepository(client);
    _certificateRepo = CertificateRepository(client);
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      // Derive counts from list APIs
      final instruments = await _instrumentRepo.listInstruments(null);
      final apps = await _applicationRepo.listApplications(null);
      final assignments = await _assignmentRepo.getAssignments();
      final certs = await _certificateRepo.listCertificates(null);

      setState(() {
        _stats = {
          'total_instruments': instruments.length,
          'active_instruments': instruments.where((i) => i.status == 'ACTIVE').length,
          'pending_apps': apps.where((a) => a.status == 'SUBMITTED' || a.status == 'UNDER_REVIEW').length,
          'active_assignments': assignments.where((a) => a.status == 'ASSIGNED' || a.status == 'ACCEPTED' || a.status == 'IN_PROGRESS').length,
          'total_certs': certs.length,
        };
      });
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
        title: const Text('Admin Command Center'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDashboardData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
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
            ElevatedButton(onPressed: _loadDashboardData, child: const Text('Retry')),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'System Overview',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
          ),
          const SizedBox(height: 16),
          _buildStatsGrid(),
          const SizedBox(height: 32),
          const Text(
            'Requires Attention',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
          ),
          const SizedBox(height: 16),
          _buildAttentionSection(),
        ],
      ),
    );
  }

  Widget _buildStatsGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.5,
      children: [
        _buildStatCard('Instruments', _stats['total_instruments'] ?? 0, Icons.settings_input_component, AppColors.primary),
        _buildStatCard('Active', _stats['active_instruments'] ?? 0, Icons.check_circle, Colors.green),
        _buildStatCard('Pending Apps', _stats['pending_apps'] ?? 0, Icons.assignment_late, Colors.orange),
        _buildStatCard('Active Assign', _stats['active_assignments'] ?? 0, Icons.people, Colors.blue),
      ],
    );
  }

  Widget _buildStatCard(String label, int value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(value.toString(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildAttentionSection() {
    return Column(
      children: [
        _buildActionTile(
          'Applications Awaiting Review',
          _stats['pending_apps'] ?? 0,
          Icons.pending_actions,
          () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ApplicationListScreen())),
        ),
        _buildActionTile(
          'Manage Officer Assignments',
          _stats['active_assignments'] ?? 0,
          Icons.assignment_ind,
          () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AssignmentListScreen())),
        ),
      ],
    );
  }

  Widget _buildActionTile(String title, int count, IconData icon, VoidCallback onTap) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade300),
      ),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(title),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (count > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.orange.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text('$count', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.orange)),
              ),
            const Icon(Icons.chevron_right),
          ],
        ),
        onTap: onTap,
      ),
    );
  }
}