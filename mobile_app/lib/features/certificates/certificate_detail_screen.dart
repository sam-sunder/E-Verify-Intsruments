import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/network/api_client.dart';
import 'certificate_repository.dart';
import 'package:e_verify_met_mobile/core/config/theme_colors.dart';

class CertificateDetailScreen extends StatefulWidget {
  final String certificateNumber;
  const CertificateDetailScreen({super.key, required this.certificateNumber});

  @override
  State<CertificateDetailScreen> createState() => _CertificateDetailScreenState();
}

class _CertificateDetailScreenState extends State<CertificateDetailScreen> {
  late CertificateRepository _repository;
  CertificateModel? _certificate;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _repository = CertificateRepository(context.read<ApiClient>());
    _loadCertificate();
  }

  Future<void> _loadCertificate() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      _certificate = await _repository.getCertificate(widget.certificateNumber);
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Certificate Detail')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_errorMessage != null) return Center(child: Text(_errorMessage!));
    if (_certificate == null) return const Center(child: Text('Certificate not found'));

    final cert = _certificate!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Column(
                children: [
                  QrImageView(
                    data: cert.publicVerificationUrl,
                    version: QrVersions.auto,
                    size: 200.0,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Scan to verify certificate',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),
          _buildSection('Certificate Details', [
            _buildRow('Certificate No', cert.certificateNumber),
            _buildRow('Status', cert.status),
            _buildRow('Issued Date', cert.issuedAt.substring(0, 10)),
            _buildRow('Valid From', cert.validFrom.substring(0, 10)),
            _buildRow('Valid To', cert.validTo.substring(0, 10)),
          ]),
          const SizedBox(height: 24),
          _buildSection('Instrument', [
            _buildRow('Type', cert.instrument.instrumentType),
            _buildRow('Serial Number', cert.instrument.serialNumber),
            _buildRow('Public ID', cert.instrument.publicInstrumentId),
          ]),
          const SizedBox(height: 24),
          _buildSection('Verification Result', [
            _buildRow('Result', cert.verificationResult),
            _buildRow('Date', cert.verificationDate.substring(0, 10)),
            _buildRow('Issued By', cert.issuedByName),
          ]),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                // Download/Share action
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Download feature coming soon')),
                );
              },
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
              child: const Text('Download Certificate'),
            ),
          ),
        ],
      ),
    );
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