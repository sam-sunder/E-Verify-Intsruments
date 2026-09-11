import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/api_client.dart';

class ComplianceScreen extends StatefulWidget {
  const ComplianceScreen({super.key});

  @override
  State<ComplianceScreen> createState() => _ComplianceScreenState();
}

class _ComplianceScreenState extends State<ComplianceScreen> {
  late ApiClient _apiClient;
  Map<String, dynamic>? _summary;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _apiClient = context.read<ApiClient>();
    _loadCompliance();
  }

  Future<void> _loadCompliance() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      _summary = await _apiClient.request(
        path: '/compliance/summary',
        method: 'GET',
      );
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
        title: const Text('Compliance Overview'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadCompliance),
        ],
      ),
      body: _buildBody(),
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
            ElevatedButton(onPressed: _loadCompliance, child: const Text('Retry')),
          ],
        ),
      );
    }

    if (_summary == null) return const Center(child: Text('No compliance data available.'));

    final totals = _summary!['totals'] as Map<String, dynamic>;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Compliance Summary',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.teal),
          ),
          const SizedBox(height: 16),
          _buildStatsGrid(totals),
          const SizedBox(height: 32),
          const Text(
            'Compliance Breakdown',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.teal),
          ),
          const SizedBox(height: 16),
          _buildComplianceList(totals),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(Map<String, dynamic> totals) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.5,
      children: [
        _buildStatCard('VALID', totals['VALID'] ?? 0, Colors.green),
        _buildStatCard('UPCOMING', totals['UPCOMING'] ?? 0, Colors.blue),
        _buildStatCard('DUE SOON', totals['DUE_SOON'] ?? 0, Colors.orange),
        _buildStatCard('CRITICAL', totals['CRITICAL'] ?? 0, Colors.red),
      ],
    );
  }

  Widget _buildStatCard(String label, int value, Color color) {
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
          Text(value.toString(), style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildComplianceList(Map<String, dynamic> totals) {
    return Column(
      children: [
        _buildComplianceRow('Valid', totals['VALID'] ?? 0, Colors.green),
        _buildComplianceRow('Upcoming', totals['UPCOMING'] ?? 0, Colors.blue),
        _buildComplianceRow('Due Soon', totals['DUE_SOON'] ?? 0, Colors.orange),
        _buildComplianceRow('Critical/Expired', totals['CRITICAL'] ?? 0, Colors.red),
      ],
    );
  }

  Widget _buildComplianceRow(String label, int count, Color color) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade300),
      ),
      child: ListTile(
        leading: Icon(Icons.info_outline, color: color),
        title: Text(label),
        trailing: Text('$count', style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }
}
