import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../field_verification_provider.dart';
import 'package:e_verify_met_mobile/core/config/theme_colors.dart';

class OutcomeStep extends StatefulWidget {
  const OutcomeStep({super.key});

  @override
  State<OutcomeStep> createState() => _OutcomeStepState();
}

class _OutcomeStepState extends State<OutcomeStep> {
  final _findingsController = TextEditingController();
  final _remarksController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final provider = context.read<FieldVerificationProvider>();
    _findingsController.text = provider.findingsSummary;
    _remarksController.text = provider.remarks;
  }

  @override
  void dispose() {
    _findingsController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  final List<Map<String, String>> _statuses = [
    {'id': 'PASS', 'label': 'Pass', 'desc': 'Instrument is fully compliant'},
    {'id': 'FAIL', 'label': 'Fail', 'desc': 'Instrument fails verification'},
    {'id': 'CONDITIONAL', 'label': 'Conditional', 'desc': 'Passes with conditions'},
    {'id': 'REVERIFICATION_REQUIRED', 'label': 'Re-verification', 'desc': 'Needs immediate re-check'},
    {'id': 'REJECTED', 'label': 'Rejected', 'desc': 'Instrument rejected entirely'},
    {'id': 'NOT_ELIGIBLE', 'label': 'Not Eligible', 'desc': 'Not eligible for certification'},
  ];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FieldVerificationProvider>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Verification Outcome',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
          ),
          const SizedBox(height: 8),
          const Text('Define the final result of this field verification'),
          const SizedBox(height: 24),

          _buildResultStatusSection(provider),
          const SizedBox(height: 24),
          _buildTextField('Findings', 'Detailed observations...', _findingsController, (val) {
            provider.updateFindings(val);
          }, maxLines: 4),
          const SizedBox(height: 16),
          _buildTextField('Remarks', 'Additional notes...', _remarksController, (val) {
            provider.updateRemarks(val);
          }, maxLines: 3),
          const SizedBox(height: 24),

          _buildComplianceToggle(provider),
          const SizedBox(height: 16),
          _buildEligibilityToggle(provider),
        ],
      ),
    );
  }

  Widget _buildResultStatusSection(FieldVerificationProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Result Status', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _statuses.length,
          itemBuilder: (context, index) {
            final status = _statuses[index];
            final isSelected = provider.resultStatus == status['id'];

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: InkWell(
                onTap: () => provider.updateResultStatus(status['id']!),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.neutral : Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isSelected ? AppColors.primary : Colors.grey.shade300,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        isSelected ? Icons.check_circle : Icons.radio_button_unchecked,
                        color: isSelected ? AppColors.primary : Colors.grey,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(status['label']!, style: const TextStyle(fontWeight: FontWeight.bold)),
                            Text(status['desc']!, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildTextField(String label, String hint, TextEditingController controller, Function(String) onChanged, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          maxLines: maxLines,
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

  Widget _buildComplianceToggle(FieldVerificationProvider provider) {
    return CheckboxListTile(
      title: const Text('Instrument complies with requirements'),
      subtitle: const Text('Statutory compliance confirmation'),
      value: provider.isCompliant,
      onChanged: (val) => provider.updateCompliance(val ?? false),
      activeColor: AppColors.primary,
      controlAffinity: ListTileControlAffinity.leading,
      contentPadding: EdgeInsets.zero,
    );
  }

  Widget _buildEligibilityToggle(FieldVerificationProvider provider) {
    return CheckboxListTile(
      title: const Text('Eligible for certificate issuance'),
      subtitle: const Text('Officer assessment of eligibility'),
      value: provider.certificateEligible,
      onChanged: (val) => provider.updateCertificateEligibility(val ?? false),
      activeColor: AppColors.primary,
      controlAffinity: ListTileControlAffinity.leading,
      contentPadding: EdgeInsets.zero,
    );
  }
}