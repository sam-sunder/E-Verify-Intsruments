import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../field_verification_provider.dart';

class PreCheckStep extends StatefulWidget {
  const PreCheckStep({super.key});

  @override
  State<PreCheckStep> createState() => _PreCheckStepState();
}

class _PreCheckStepState extends State<PreCheckStep> {
  final _locationController = TextEditingController();
  final _serialController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final provider = context.read<FieldVerificationProvider>();
    _locationController.text = provider.locationConfirmation ?? '';
    _serialController.text = provider.serialConfirmation ?? '';
  }

  @override
  void dispose() {
    _locationController.dispose();
    _serialController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FieldVerificationProvider>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Field Pre-check',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.teal),
          ),
          const SizedBox(height: 8),
          const Text('Verify the following before starting measurements'),
          const SizedBox(height: 24),

          _buildTextField('Serial Number Confirmation', 'Enter confirmed serial number', _serialController, (val) {
            provider.updateSerialConfirmation(val);
          }),
          const SizedBox(height: 16),
          _buildTextField('Location Confirmation', 'Enter confirmed location', _locationController, (val) {
            provider.updateLocationConfirmation(val);
          }),
          const SizedBox(height: 24),

          _buildCheckItem('Visual Condition OK', 'No physical damage to instrument', 'visual_condition', provider),
          _buildCheckItem('Seal Condition OK', 'Seals are intact and untampered', 'seal_condition', provider),
          _buildCheckItem('Standard Confirmation', 'Working standard is calibrated and valid', 'standard_confirmation', provider),
        ],
      ),
    );
  }

  Widget _buildTextField(String label, String hint, TextEditingController controller, Function(String) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          decoration: InputDecoration(
            hintText: hint,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            filled: true,
            fillColor: Colors.white,
          ),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildCheckItem(String title, String subtitle, String key, FieldVerificationProvider provider) {
    return CheckboxListTile(
      title: Text(title),
      subtitle: Text(subtitle),
      value: provider.preCheckStatus[key] ?? false,
      onChanged: (val) => provider.updatePreCheck(key, val ?? false),
      activeColor: Colors.teal,
      controlAffinity: ListTileControlAffinity.leading,
      contentPadding: EdgeInsets.zero,
    );
  }
}
