import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/api_client.dart';
import '../../features/instruments/instrument_repository.dart';

class InstrumentDetailScreen extends StatefulWidget {
  final String publicInstrumentId;
  const InstrumentDetailScreen({super.key, required this.publicInstrumentId});

  @override
  State<InstrumentDetailScreen> createState() => _InstrumentDetailScreenState();
}

class _InstrumentDetailScreenState extends State<InstrumentDetailScreen> {
  late InstrumentRepository _repository;
  InstrumentModel? _instrument;
  InstrumentHistoryModel? _history;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _repository = InstrumentRepository(context.read<ApiClient>());
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final results = await Future.wait([
        _repository.getInstrument(widget.publicInstrumentId),
        _repository.getInstrumentHistory(widget.publicInstrumentId),
      ]);
      setState(() {
        _instrument = results[0] as InstrumentModel;
        _history = results[1] as InstrumentHistoryModel;
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
      appBar: AppBar(title: const Text('Instrument Passport')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_errorMessage != null) return Center(child: Text(_errorMessage!));
    if (_instrument == null) return const Center(child: Text('Instrument not found'));

    final i = _instrument!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSection('Identity', [
            _buildRow('Public ID', i.publicInstrumentId),
            _buildRow('Type', i.instrumentType),
            _buildRow('Category', i.category),
            _buildRow('Serial Number', i.serialNumber),
            _buildRow('Manufacturer', i.manufacturer ?? 'N/A'),
            _buildRow('Model', i.model ?? 'N/A'),
          ]),
          const SizedBox(height: 24),
          _buildSection('Current Status', [
            _buildRow('Status', i.status),
            _buildRow('Location', i.currentLocation ?? 'N/A'),
            _buildRow('Registered At', i.registeredAt),
            _buildRow('Last Verified', i.lastVerifiedAt ?? 'Never'),
            _buildRow('Next Due Date', i.nextDueDate ?? 'N/A'),
          ]),
          const SizedBox(height: 24),
          if (_history != null) ...[
            _buildSection('Lifecycle History', [
              ..._buildTimeline(),
            ]),
          ],
        ],
      ),
    );
  }

  List<Widget> _buildTimeline() {
    final List<Widget> items = [];
    for (var v in _history!.verifications) {
      items.add(_buildTimelineItem(v.verificationDate, 'Verification: ${v.resultStatus}', Colors.teal));
    }
    for (var a in _history!.audit) {
      items.add(_buildTimelineItem(a.changedAt, '${a.actionType}: ${a.newValue ?? a.oldValue}', Colors.grey));
    }
    return items;
  }

  Widget _buildTimelineItem(String date, String event, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Icon(Icons.circle, size: 12, color: color),
              Expanded(child: Container(width: 2, color: Colors.grey.shade300)),
            ],
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(date, style: const TextStyle(fontSize: 10, color: Colors.grey)),
              Text(event, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
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
}
