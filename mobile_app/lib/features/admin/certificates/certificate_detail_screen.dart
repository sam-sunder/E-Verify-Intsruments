import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/network/api_client.dart';
import '../../features/certificates/certificate_repository.dart';

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
  bool _isProcessing = false;

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

  Future<void> _handleStatusChange(String action) async {
    final controller = TextEditingController();
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Confirm $action'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('This action changes the official certificate status.'),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              decoration: const InputDecoration(labelText: 'Reason for $action'),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _performStatusChange(action, controller.text.trim());
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  Future<void> _performStatusChange(String action, String reason) async {
    setState(() => _isProcessing = true);
    try {
      final client = context.read<ApiClient>();
      final path = action == 'revoke'
        ? '/certificates/${widget.certificateNumber}/revoke'
        : '/certificates/${widget.certificateNumber}/suspend';

      await client.request(
        path: path,
        method: 'POST',
        body: {'reason': reason},
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Certificate ${action}ed successfully')),
      );
      await _loadCertificate();
    } catch (e) {
      ScHaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Action failed: ${e.toString()}')),
      );
    } finally {
      setState(() => _isProcessing = false);
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
                    size: 180.0,
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
          if (cert.status == 'ACTIVE')
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isProcessing ? null : () => _handleStatusChange('suspend'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Suspend'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isProcessing ? null : () => _handleStatusChange('revoke'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Revoke'),
                  ),
                ),
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
