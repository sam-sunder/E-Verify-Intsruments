import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/api_client.dart';
import 'application_repository.dart';
import '../instruments/instrument_repository.dart';
import 'application_detail_screen.dart';

class ApplicationCreationScreen extends StatefulWidget {
  final String? initialType;
  final String? initialInstrumentId;
  const ApplicationCreationScreen({super.key, this.initialType, this.initialInstrumentId});

  @override
  State<ApplicationCreationScreen> createState() => _ApplicationCreationScreenState();
}

class _ApplicationCreationScreenState extends State<ApplicationCreationScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedInstrumentId;
  String _selectedType = 'INITIAL_VERIFICATION';
  final _remarksController = TextEditingController();
  bool _isLoading = false;

  List<InstrumentModel> _availableInstruments = [];

  @override
  void initState() {
    super.initState();
    _loadInstruments();
    if (widget.initialType != null) {
      _selectedType = widget.initialType!;
    }
  }

  Future<void> _loadInstruments() async {
    try {
      final repo = InstrumentRepository(context.read<ApiClient>());
      _availableInstruments = await repo.listInstruments(null);

      if (widget.initialInstrumentId != null) {
        _selectedInstrumentId = widget.initialInstrumentId;
      }

      setState(() {});
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load instruments: ${e.toString()}')),
      );
    }
  }

  @override
  void dispose() {
    _remarksController.dispose();
    super.dispose();
  }

  Future<void> _handleCreate() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final repo = ApplicationRepository(context.read<ApiClient>());
      final app = await repo.createApplication({
        'instrumentId': _selectedInstrumentId!,
        'applicationType': _selectedType,
        'remarks': _remarksController.text.trim(),
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Application created successfully')),
      );

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => ApplicationDetailScreen(applicationNumber: app.applicationNumber)),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Creation failed: ${e.toString()}')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Application')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Application Details',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.teal),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _selectedInstrumentId,
                decoration: const InputDecoration(labelText: 'Select Instrument', border: OutlineInputBorder()),
                items: _availableInstruments.map((i) {
                  return DropdownMenuItem(
                    value: i.publicInstrumentId,
                    child: Text('${i.instrumentType} - ${i.serialNumber}'),
                  );
                }).toList(),
                onChanged: (val) => setState(() => _selectedInstrumentId = val),
                validator: (val) => val == null ? 'Please select an instrument' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _selectedType,
                decoration: const InputDecoration(labelText: 'Application Type', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'INITIAL_VERIFICATION', child: Text('Initial Verification')),
                  DropdownMenuItem(value: 'RE_VERIFICATION', child: Text('Re-verification')),
                  DropdownMenuItem(value: 'REPLACEMENT_REQUEST', child: Text('Replacement Request')),
                  DropdownMenuItem(value: 'COMPLIANCE_REVIEW', child: Text('Compliance Review')),
                ],
                onChanged: (val) => setState(() => _selectedType = val!),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _remarksController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Remarks (Optional)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleCreate,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Colors.teal,
                    foregroundColor: Colors.white,
                  ),
                  child: _isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Submit Application', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
