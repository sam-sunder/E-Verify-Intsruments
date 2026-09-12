import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/api_client.dart';
import 'instrument_repository.dart';
import 'instrument_detail_screen.dart';
import 'package:e_verify_met_mobile/core/config/theme_colors.dart';

class InstrumentRegistrationScreen extends StatefulWidget {
  const InstrumentRegistrationScreen({super.key});

  @override
  State<InstrumentRegistrationScreen> createState() => _InstrumentRegistrationScreenState();
}

class _InstrumentRegistrationScreenState extends State<InstrumentRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _typeController = TextEditingController();
  final _categoryController = TextEditingController();
  final _manufacturerController = TextEditingController();
  final _modelController = TextEditingController();
  final _serialController = TextEditingController();
  final _capacityController = TextEditingController();
  final _locationController = TextEditingController();

  bool _isLoading = false;

  @override
  void dispose() {
    _typeController.dispose();
    _categoryController.dispose();
    _manufacturerController.dispose();
    _modelController.dispose();
    _serialController.dispose();
    _capacityController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final repo = InstrumentRepository(context.read<ApiClient>());
      final instrument = await repo.createInstrument({
        'instrumentType': _typeController.text.trim(),
        'category': _categoryController.text.trim(),
        'manufacturer': _manufacturerController.text.trim(),
        'model': _modelController.text.trim(),
        'serialNumber': _serialController.text.trim(),
        'capacity': _capacityController.text.trim(),
        'currentLocation': _locationController.text.trim(),
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Instrument registered successfully')),
      );

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => InstrumentDetailScreen(publicInstrumentId: instrument.publicInstrumentId)),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Registration failed: ${e.toString()}')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Register Instrument')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Instrument Details',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
              ),
              const SizedBox(height: 16),
              _buildField('Instrument Type', _typeController, true),
              _buildField('Category', _categoryController, true),
              _buildField('Manufacturer', _manufacturerController, false),
              _buildField('Model', _modelController, false),
              _buildField('Serial Number', _serialController, true),
              _buildField('Capacity (e.g. 10kg)', _capacityController, false),
              _buildField('Current Location', _locationController, true),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleRegister,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: _isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Register Instrument', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController controller, bool required) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$label${required ? " *" : ""}',
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: controller,
            decoration: InputDecoration(
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              filled: true,
              fillColor: Colors.white,
            ),
            validator: (val) {
              if (required && (val == null || val.trim().isEmpty)) {
                return 'This field is required';
              }
              return null;
            },
          ),
        ],
      ),
    );
  }
}