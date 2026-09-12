import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import '../field_verification_provider.dart';
import 'package:e_verify_met_mobile/core/config/theme_colors.dart';

class EvidenceStep extends StatefulWidget {
  const EvidenceStep({super.key});

  @override
  State<EvidenceStep> createState() => _EvidenceStepState();
}

class _EvidenceStepState extends State<EvidenceStep> {
  final ImagePicker _picker = ImagePicker();
  File? _capturedImage;
  String _selectedCategory = 'STAMP';
  final _captionController = TextEditingController();
  bool _isPrimary = false;
  bool _isUploading = false;

  final List<Map<String, String>> _categories = [
    {'label': 'Stamp', 'value': 'STAMP'},
    {'label': 'Serial Plate', 'value': 'SERIAL_PLATE'},
    {'label': 'Scale Reading', 'value': 'SCALE_READING'},
    {'label': 'Overall View', 'value': 'OVERALL_VIEW'},
    {'label': 'Defect', 'value': 'DEFECT'},
  ];

  @override
  void dispose() {
    _captionController.dispose();
    super.dispose();
  }

  Future<void> _takePhoto() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );

      if (photo != null) {
        setState(() {
          _capturedImage = File(photo.path);
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Camera error: ${e.toString()}')),
      );
    }
  }

  Future<void> _uploadEvidence() async {
    if (_capturedImage == null) return;

    setState(() => _isUploading = true);
    try {
      await context.read<FieldVerificationProvider>().uploadEvidence(
        filePath: _capturedImage!.path,
        category: _selectedCategory,
        caption: _captionController.text,
        isPrimary: _isPrimary,
      );

      setState(() {
        _capturedImage = null;
        _captionController.clear();
        _isPrimary = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Evidence uploaded successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Upload failed: ${e.toString()}')),
      );
    } finally {
      setState(() => _isUploading = false);
    }
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
            'Evidence Capture',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
          ),
          const SizedBox(height: 8),
          const Text('Capture official photos of the instrument'),
          const SizedBox(height: 24),

          if (_capturedImage == null)
            _buildCaptureButton()
          else
            _buildPreviewSection(),

          const SizedBox(height: 32),
          const Text('Uploaded Evidence', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          provider.evidencePhotos.isEmpty
              ? const Center(child: Text('No evidence captured yet.'))
              : _buildEvidenceGallery(provider),
        ],
      ),
    );
  }

  Widget _buildCaptureButton() {
    return Center(
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: InkWell(
              onTap: _takePhoto,
              child: Column(
                children: [
                  const Icon(Icons.camera_alt, size: 64, color: AppColors.primary),
                  const SizedBox(height: 16),
                  const Text(
                    'Capture Evidence',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewSection() {
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
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.file(_capturedImage!, height: 200, width: double.infinity, fit: BoxFit.cover),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _selectedCategory,
            decoration: const InputDecoration(labelText: 'Evidence Category'),
            items: _categories.map((cat) {
              return DropdownMenuItem(value: cat['value']!, child: Text(cat['label']!));
            }).toList(),
            onChanged: (val) => setState(() => _selectedCategory = val!),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _captionController,
            decoration: const InputDecoration(labelText: 'Caption (Optional)', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          CheckboxListTile(
            title: const Text('Mark as Primary Evidence'),
            value: _isPrimary,
            onChanged: (val) => setState(() => _isPrimary = val ?? false),
            activeColor: AppColors.primary,
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => _capturedImage = null),
                  child: const Text('Retake'),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: _isUploading ? null : _uploadEvidence,
                  child: _isUploading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Upload'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEvidenceGallery(FieldVerificationProvider provider) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: provider.evidencePhotos.length,
      itemBuilder: (context, index) {
        final photo = provider.evidencePhotos[index];
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                  child: Image.network(
                    photo.fileUrl,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.broken_image)),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          photo.photoType,
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                        if (photo.isPrimaryEvidence)
                          const Icon(Icons.star, size: 12, color: Colors.amber),
                      ],
                    ),
                    if (photo.caption != null)
                      Text(
                        photo.caption!,
                        style: const TextStyle(fontSize: 11),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}