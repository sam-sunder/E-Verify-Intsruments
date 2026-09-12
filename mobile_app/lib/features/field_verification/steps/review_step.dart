import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../field_verification_provider.dart';
import 'package:e_verify_met_mobile/core/config/theme_colors.dart';

class ReviewStep extends StatefulWidget {
  const ReviewStep({super.key});

  @override
  State<ReviewStep> createState() => _ReviewStepState();
}

class _ReviewStepState extends State<ReviewStep> {
  bool _isSubmitting = false;

  final List<Map<String, String>> _statusLabels = [
    {'id': 'PASS', 'label': 'Pass'},
    {'id': 'FAIL', 'label': 'Fail'},
    {'id': 'CONDITIONAL', 'label': 'Conditional'},
    {'id': 'REVERIFICATION_REQUIRED', 'label': 'Re-verification Required'},
    {'id': 'REJECTED', 'label': 'Rejected'},
    {'id': 'NOT_ELIGIBLE', 'label': 'Not Eligible'},
  ];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FieldVerificationProvider>();
    final v = provider.verification;

    if (v == null) return const Center(child: Text('No verification data found'));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Final Review',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
          ),
          const SizedBox(height: 8),
          const Text('Please review all data before final submission'),
          const SizedBox(height: 24),

          _buildSection('Instrument', [
            _buildRow('Serial Number', provider.assignment?.instrument.serialNumber ?? '—'),
            _buildRow('Application No', provider.assignment?.application.applicationNumber ?? '—'),
          ]),
          const SizedBox(height: 24),

          _buildSection('Pre-check', [
            _buildCheckRow('Serial Confirmed', provider.serialConfirmation != null),
            _buildCheckRow('Location Confirmed', provider.locationConfirmation != null),
            _buildCheckRow('Visual Condition', provider.preCheckStatus['visual_condition'] ?? false),
            _buildCheckRow('Seal Condition', provider.preCheckStatus['seal_condition'] ?? false),
            _buildCheckRow('Standard Confirmed', provider.preCheckStatus['standard_confirmation'] ?? false),
          ]),
          const SizedBox(height: 24),

          _buildSection('Measurements', [
            ...provider.measurements.map((m) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(m.parameterName, style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text(m.passFail ? 'PASS' : 'FAIL',
                        style: TextStyle(color: m.passFail ? Colors.green : Colors.red, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const Divider(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildValPair('Std', m.standardValue ?? '—'),
                      _buildValPair('Measured', m.measuredValue),
                      _buildValPair('Error', m.calculatedError ?? '—'),
                      _buildValPair('Tol', m.tolerance ?? '—'),
                    ],
                  ),
                ],
              ),
            )).toList(),
          ]),
          const SizedBox(height: 24),

          _buildSection('Evidence', [
            Text('Total Photos: ${provider.evidencePhotos.length}'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: provider.evidencePhotos.map((p) => Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  border: Border.all(color: p.isPrimaryEvidence ? Colors.amber : Colors.grey),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(p.photoType, style: const TextStyle(fontSize: 10)),
              )).toList(),
            ),
          ]),
          const SizedBox(height: 24),

          _buildSection('Outcome', [
            _buildRow('Result', _getStatusLabel(provider.resultStatus)),
            _buildRow('Findings', provider.findingsSummary.isEmpty ? 'None' : provider.findingsSummary),
            _buildRow('Remarks', provider.remarks.isEmpty ? 'None' : provider.remarks),
            _buildCheckRow('Compliant', provider.isCompliant),
            _buildCheckRow('Cert Eligible', provider.certificateEligible),
          ]),
          const SizedBox(height: 32),

          _buildSubmitButton(context, provider),
        ],
      ),
    );
  }

  String _getStatusLabel(String? status) {
    final match = _statusLabels.firstWhere(
      (s) => s['id'] == status,
      orElse: () => {'label': 'Unknown'},
    );
    return match['label']!;
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
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

  Widget _buildCheckRow(String label, bool value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey)),
        Icon(
          value ? Icons.check_circle : Icons.cancel,
          color: value ? Colors.green : Colors.red,
          size: 18,
        ),
      ],
    );
  }

  Widget _buildValPair(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _buildSubmitButton(BuildContext context, FieldVerificationProvider provider) {
    if (provider.isFinalized) {
      return Center(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.green),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.check_circle, color: Colors.green),
              SizedBox(width: 8),
              Text('Verification Finalized', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      );
    }

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isSubmitting ? null : () => _confirmSubmit(context, provider),
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
        child: _isSubmitting
            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : const Text('Submit Verification', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Future<void> _confirmSubmit(BuildContext context, FieldVerificationProvider provider) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Final Submission'),
        content: const Text('This is the final submission. After submitting, the verification record will become immutable and cannot be edited.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Confirm & Submit')),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isSubmitting = true);
      try {
        await provider.submitVerification();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Verification submitted successfully!')),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submission failed: ${e.toString()}')),
        );
      } finally {
      setState(() => _isSubmitting = false);
      }
    }
  }
}