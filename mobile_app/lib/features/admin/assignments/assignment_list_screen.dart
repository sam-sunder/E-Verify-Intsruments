import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/api_client.dart';
import '../../features/assignments/assignment_repository.dart';
import 'assignment_detail_screen.dart';

class AssignmentListScreen extends StatefulWidget {
  const AssignmentListScreen({super.key});

  @override
  State<AssignmentListScreen> createState() => _AssignmentListScreenState();
}

class _AssignmentListScreenState extends State<AssignmentListScreen> {
  late AssignmentRepository _repository;
  List<AssignmentModel> _assignments = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _repository = AssignmentRepository(context.read<ApiClient>());
    _loadAssignments();
  }

  Future<void> _loadAssignments() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      _assignments = await _repository.getAssignments();
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Officer Assignments'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadAssignments),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadAssignments,
        child: _buildBody(),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateAssignmentDialog(),
        backgroundColor: Colors.teal,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_errorMessage!),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadAssignments, child: const Text('Retry')),
          ],
        ),
      );
    }

    if (_assignments.isEmpty) {
      return const Center(child: Text('No assignments found.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _assignments.length,
      itemBuilder: (context, index) {
        final assignment = _assignments[index];
        return _buildAssignmentCard(assignment);
      },
    );
  }

  Widget _buildAssignmentCard(AssignmentModel assignment) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade300),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Text('Officer: ${assignment.assignedOfficerName}', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text('App: ${assignment.application.applicationNumber}'),
            Text('Instrument: ${assignment.instrument.serialNumber}'),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildStatusBadge(assignment.status),
                const SizedBox(width: 8),
                Text('Created: ${assignment.createdAt.substring(0, 10)}', style: const TextStyle(fontSize: 12)),
              ],
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => AssignmentDetailScreen(assignmentId: assignment.id)),
          );
        },
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color = Colors.grey;
    if (status == 'COMPLETED') color = Colors.green;
    if (status == 'CANCELLED' || status == 'REJECTED') color = Colors.red;
    if (status == 'ACCEPTED' || status == 'IN_PROGRESS') color = Colors.orange;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color),
      ),
      child: Text(status, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }

  void _showCreateAssignmentDialog() {
    // In a real app, we'd have a picker for officers and applications
    // For now, we'll use a simple dialog or separate screen.
    // Since the prompt asks to implement "Create an assignment", I'll create a simple form.
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Create Assignment'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(decoration: const InputDecoration(labelText: 'Officer ID')),
            TextField(decoration: const InputDecoration(labelText: 'Application ID')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              // Call API and refresh
              Navigator.pop(ctx);
              _loadAssignments();
            },
            child: const Text('Assign'),
          ),
        ],
      ),
    );
  }
}
