import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/auth/auth_service.dart';
import '../../../core/network/api_client.dart';
import '../../../features/instruments/instrument_repository.dart';
import '../../../features/applications/application_repository.dart';
import '../../../features/certificates/certificate_repository.dart';
import '../../../features/instruments/instrument_registration_screen.dart';
import '../../../features/applications/application_creation_screen.dart';
import '../../../features/certificates/certificate_list_screen.dart';
import 'package:e_verify_met_mobile/core/config/theme_colors.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late InstrumentRepository _instrumentRepo;
  late ApplicationRepository _applicationRepo;
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
    _certificateRepo = CertificateRepository(client);
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final instruments = await _instrumentRepo.listInstruments(null);
      final apps = await _applicationRepo.listApplications(null);
      final certs = await _certificateRepo.listCertificates(null);

      setState(() {
        _stats = {
          'total_instruments': instruments.length,
          'active_instruments': instruments.where((i) => i.status == 'ACTIVE').length,
          'active_apps': apps.where((a) => a.status != 'CERTIFICATE_ISSUED' && a.status != 'REJECTED').length,
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
    final user = context.watch<AuthService>().currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Owner Portal'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.account_circle),
            onSelected: (value) {
              if (value == 'logout') {
                context.read<AuthService>().logout();
              } else if (value == 'profile') {
                // Navigate to Profile (if implemented)
              }
            },
            itemBuilder: (BuildContext context) => [
              const PopupMenuItem<String>(
                value: 'profile',
                child: Row(
                  children: [
                    Icon(Icons.person, size: 20),
                    SizedBox(width: 8),
                    Text('My Profile'),
                  ],
                ),
              ),
              const PopupMenuItem<String>(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout, size: 20, color: Colors.red),
                    SizedBox(width: 8),
                    Text('Logout', style: TextStyle(color: Colors.red)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        child: _buildBody(user),
      ),
    );
  }

  Widget _buildBody(dynamic user) {
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
          Text(
            'Welcome, ${user?.fullName ?? "Business Owner"}',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.secondary,
                ),
          ),
          const SizedBox(height: 24),
          _buildOverviewGrid(),
          const SizedBox(height: 32),
          const Text('Quick Actions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _buildActionGrid(),
        ],
      ),
    );
  }

  Widget _buildOverviewGrid() {
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
        _buildStatCard('Applications', _stats['active_apps'] ?? 0, Icons.assignment, Colors.orange),
        _buildStatCard('Certificates', _stats['total_certs'] ?? 0, Icons.card_membership, Colors.blue),
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

  Widget _buildActionGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 1,
      mainAxisSpacing: 12,
      childAspectRatio: 4,
      children: [
        _buildActionItem('Register New Instrument', Icons.add_circle, AppColors.primary, () {
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => const InstrumentRegistrationScreen()));
        }),
        _buildActionItem('Apply for Verification', Icons.send, Colors.orange, () {
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ApplicationCreationScreen()));
        }),
        _buildActionItem('View All Certificates', Icons.card_membership, Colors.blue, () {
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CertificateListScreen()));
        }),
      ],
    );
  }

  Widget _buildActionItem(String label, IconData icon, Color color, VoidCallback onTap) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade300),
      ),
      child: ListTile(
        leading: Icon(icon, color: color),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
