import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/api_client.dart';
import '../instruments/instrument_repository.dart';
import 'instrument_registration_screen.dart';
import 'instrument_detail_screen.dart';
import 'package:e_verify_met_mobile/core/config/theme_colors.dart';

class InstrumentListScreen extends StatefulWidget {
  const InstrumentListScreen({super.key});

  @override
  State<InstrumentListScreen> createState() => _InstrumentListScreenState();
}

class _InstrumentListScreenState extends State<InstrumentListScreen> {
  late InstrumentRepository _repository;
  List<InstrumentModel> _instruments = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _repository = InstrumentRepository(context.read<ApiClient>());
    _loadInstruments();
  }

  Future<void> _loadInstruments() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      _instruments = await _repository.listInstruments({'query': _searchQuery});
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
        title: const Text('My Instruments'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search instruments...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(30)),
                filled: true,
                fillColor: Colors.white,
              ),
              onChanged: (val) {
                setState(() => _searchQuery = val);
                _loadInstruments();
              },
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadInstruments,
        child: _buildBody(),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const InstrumentRegistrationScreen()),
          );
        },
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
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
            ElevatedButton(onPressed: _loadInstruments, child: const Text('Retry')),
          ],
        ),
      );
    }

    if (_instruments.isEmpty) {
      return const Center(child: Text('No instruments found.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _instruments.length,
      itemBuilder: (context, index) {
        final instrument = _instruments[index];
        return _buildInstrumentCard(instrument);
      },
    );
  }

  Widget _buildInstrumentCard(InstrumentModel instrument) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade300),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Text(instrument.instrumentType, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text('S/N: ${instrument.serialNumber}'),
            Text('ID: ${instrument.publicInstrumentId}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildStatusBadge(instrument.status),
                const SizedBox(width: 8),
                Text(instrument.currentLocation ?? 'No location', style: const TextStyle(fontSize: 12)),
              ],
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => InstrumentDetailScreen(publicInstrumentId: instrument.publicInstrumentId)),
          );
        },
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color = Colors.grey;
    if (status == 'ACTIVE') color = Colors.green;
    if (status == 'EXPIRED' || status == 'REVOKED') color = Colors.red;

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