import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../field_verification_provider.dart';
import 'package:e_verify_met_mobile/core/config/theme_colors.dart';

class MeasurementsStep extends StatefulWidget {
  const MeasurementsStep({super.key});

  @override
  State<MeasurementsStep> createState() => _MeasurementsStepState();
}

class _MeasurementsStepState extends State<MeasurementsStep> {
  final _standardController = TextEditingController();
  final _measuredController = TextEditingController();
  final _toleranceController = TextEditingController();
  final _referenceController = TextEditingController();
  String _selectedType = 'MASS'; // Default

  @override
  void dispose() {
    _standardController.dispose();
    _measuredController.dispose();
    _toleranceController.dispose();
    _referenceController.dispose();
    super.dispose();
  }

  void _clearForm() {
    _standardController.clear();
    _measuredController.clear();
    _toleranceController.clear();
    _referenceController.clear();
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
            'Instrument Measurements',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
          ),
          const SizedBox(height: 8),
          const Text('Enter precise values as measured in the field'),
          const SizedBox(height: 24),

          _buildAddMeasurementForm(provider),
          const SizedBox(height: 32),

          const Text('Recorded Measurements', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),

          provider.measurements.isEmpty
              ? const Center(child: Text('No measurements recorded yet.'))
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: provider.measurements.length,
                  itemBuilder: (context, index) {
                    return _buildMeasurementCard(provider, index);
                  },
                ),
        ],
      ),
    );
  }

  Widget _buildAddMeasurementForm(FieldVerificationProvider provider) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DropdownButtonFormField<String>(
            initialValue: _selectedType,
            decoration: const InputDecoration(labelText: 'Measurement Type'),
            items: const [
              DropdownMenuItem(value: 'MASS', child: Text('Mass')),
              DropdownMenuItem(value: 'LENGTH', child: Text('Length')),
              DropdownMenuItem(value: 'VOLUME', child: Text('Volume')),
            ],
            onChanged: (val) => setState(() => _selectedType = val!),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildNumericField('Standard Value', _standardController),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildNumericField('Measured Value', _measuredController),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildNumericField('Tolerance', _toleranceController),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildTextField('Reference', _referenceController),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _handleSave,
              child: const Text('Add Measurement'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNumericField(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          keyboardType: TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            filled: true,
            fillColor: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            filled: true,
            fillColor: Colors.white,
          ),
        ),
      ],
    );
  }

  Future<void> _handleSave() async {
    if (_measuredController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Measured value is required')));
      return;
    }

    try {
      final provider = context.read<FieldVerificationProvider>();
      await provider.addMeasurement({
        'measurementType': _selectedType,
        'parameterName': 'Primary',
        'standardValue': _standardController.text,
        'measuredValue': _measuredController.text,
        'tolerance': _toleranceController.text,
        'standardReference': _referenceController.text,
      });
      _clearForm();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Measurement recorded')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to record: ${e.toString()}')));
    }
  }

  Widget _buildMeasurementCard(FieldVerificationProvider provider, int index) {
    final m = provider.measurements[index];
    final isPass = m.passFail;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(m.measurementType, style: const TextStyle(fontWeight: FontWeight.bold)),
                _buildStatusBadge(isPass),
              ],
            ),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildValPair('Standard', m.standardValue ?? 'N/A'),
                _buildValPair('Measured', m.measuredValue),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildValPair('Error', m.calculatedError ?? '—'),
                _buildValPair('Tolerance', m.tolerance ?? '—'),
              ],
            ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => provider.removeMeasurement(index),
                child: const Text('Remove', style: TextStyle(color: Colors.red)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildValPair(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _buildStatusBadge(bool isPass) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isPass ? Colors.green.shade100 : Colors.red.shade100,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        isPass ? 'PASS' : 'FAIL',
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: isPass ? Colors.green.shade800 : Colors.red.shade800,
        ),
      ),
    );
  }
}