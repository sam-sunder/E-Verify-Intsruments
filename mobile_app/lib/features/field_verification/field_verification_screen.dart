import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'field_verification_provider.dart';
import 'steps/pre_check_step.dart';
import 'steps/measurements_step.dart';
import 'steps/evidence_step.dart';
import 'steps/outcome_step.dart';

class FieldVerificationScreen extends StatefulWidget {
  final String assignmentId;
  const FieldVerificationScreen({super.key, required this.assignmentId});

  @override
  State<FieldVerificationScreen> createState() => _FieldVerificationScreenState();
}

class _FieldVerificationScreenState extends State<FieldVerificationScreen> {
  int _currentStep = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FieldVerificationProvider>().loadVerification(widget.assignmentId);
    });
  }

  void _nextStep() {
    if (_currentStep < 4) {
      setState(() => _currentStep++);
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Field Verification'),
        leading: _currentStep > 0
          ? IconButton(icon: const Icon(Icons.arrow_back), onPressed: _prevStep)
          : null,
      ),
      body: Column(
        children: [
          _buildProgressIndicator(),
          Expanded(
            child: _buildCurrentStep(),
          ),
          _buildNavigationFooter(),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator() {
    final steps = ['Pre-check', 'Measurements', 'Evidence', 'Outcome', 'Review'];
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      color: Colors.white,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        shrinkWrap: true,
        itemCount: steps.length,
        itemBuilder: (context, index) {
          final isCompleted = index < _currentStep;
          final isCurrent = index == _currentStep;
          final isLocked = index > _currentStep && index > 1; // Steps 3-5 are not yet implemented

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 12,
                  backgroundColor: isCurrent ? Colors.teal : (isCompleted ? Colors.teal : Colors.grey.shade300),
                  child: isCompleted
                    ? const Icon(Icons.check, size: 14, color: Colors.white)
                    : Text('${index + 1}', style: TextStyle(fontSize: 12, color: isCurrent ? Colors.white : Colors.black)),
                ),
                const SizedBox(height: 4),
                Text(
                  steps[index],
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                    color: isLocked ? Colors.grey : (isCurrent ? Colors.teal : Colors.black),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return const PreCheckStep();
      case 1:
        return const MeasurementsStep();
      case 2:
        return const EvidenceStep();
      case 3:
        return const OutcomeStep();
      default:
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.construction, size: 48, color: Colors.grey),
              const SizedBox(height: 16),
              Text('Step ${_currentStep + 1} is not yet implemented'),
            ],
          ),
        );
    }
  }

  Widget _buildNavigationFooter() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade300)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (_currentStep > 0)
            TextButton(
              onPressed: _prevStep,
              child: const Text('Back'),
            )
          else
            const SizedBox.shrink(),
          ElevatedButton(
            onPressed: _canContinue() ? _nextStep : null,
            child: Text(_currentStep == 4 ? 'Submit' : 'Continue'),
          ),
        ],
      ),
    );
  }

  bool _canContinue() {
    if (_currentStep == 0) {
      return context.read<FieldVerificationProvider>().isPreCheckComplete();
    }
    if (_currentStep == 3) {
      return context.read<FieldVerificationProvider>().isOutcomeComplete();
    }
    return true;
  }
}
