import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/auth/auth_service.dart';
import '../assignments/assignments_screen.dart';
import '../assignments/assignment_repository.dart';
import '../field_verification/field_verification_screen.dart';
import '../field_verification/field_verification_provider.dart';
import '../field_verification/field_verification_repository.dart';
import '../../core/network/api_client.dart';
import 'package:e_verify_met_mobile/core/config/theme_colors.dart';
import '../notifications/notification_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late AssignmentRepository _repository;
  Map<String, int> _stats = {};
  AssignmentModel? _inProgressAssignment;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _repository = AssignmentRepository(context.read<ApiClient>());
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final stats = await _repository.getDashboardStats();
      final inProgress = await _repository.getInProgressAssignment();
      setState(() {
        _stats = stats;
        _inProgressAssignment = inProgress;
      });
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthService>().currentUser;

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Officer Dashboard'),
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: AppColors.secondary,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.account_circle),
            onSelected: (value) {
              if (value == 'logout') {
                context.read<AuthService>().logout();
              } else if (value == 'profile') {
                // Navigate to Profile (if implemented)
              }
            },
            itemBuilder: (BuildContext context) => [
              const PopupMenuItem<String>(
                value: 'profile',
                child: Row(
                  children: [
                    Icon(Icons.person, size: 20),
                    SizedBox(width: 8),
                    Text('My Profile'),
                  ],
                ),
              ),
              const PopupMenuItem<String>(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout, size: 20, color: Colors.red),
                    SizedBox(width: 8),
                    Text('Logout', style: TextStyle(color: Colors.red)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _buildBody(user),
      ),
    );
  }

  Widget _buildBody(dynamic user) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_errorMessage!),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadData, child: const Text('Retry')),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome, ${user?.fullName ?? "Officer"}',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.secondary,
                ),
          ),
          const Text(
            'Here is what is happening with your assignments today.',
            style: TextStyle(color: Colors.grey, fontSize: 16),
          ),
          const SizedBox(height: 32),
          const Text('Your Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _buildStatsCarousel(),
          const SizedBox(height: 32),
          const Text('Quick Actions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _buildActionList(),
        ],
      ),
    );
  }

  Widget _buildStatsCarousel() {
    final statList = [
      {'label': 'Pending', 'value': _stats['PENDING'] ?? 0, 'color': Colors.orange},
      {'label': 'Accepted', 'value': _stats['ACCEPTED'] ?? 0, 'color': Colors.blue},
      {'label': 'In-Progress', 'value': _stats['IN_PROGRESS'] ?? 0, 'color': AppColors.primary},
      {'label': 'Completed', 'value': _stats['COMPLETED'] ?? 0, 'color': Colors.green},
    ];

    return SizedBox(
      height: 120,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: statList.length,
        separatorBuilder: (context, index) => const SizedBox(width: 16),
        itemBuilder: (context, index) {
          final stat = statList[index];
          return Container(
            width: 140,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  stat['value'].toString(),
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: stat['color'] as Color,
                  ),
                ),
                Text(
                  stat['label'] as String,
                  style: const TextStyle(color: Colors.grey, fontSize: 14, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildActionList() {
    final actions = [
      {'title': 'My Assignments', 'icon': Icons.assignment, 'color': AppColors.primary},
      {'title': 'Notifications', 'icon': Icons.notifications, 'color': Colors.orange},
      if (_inProgressAssignment != null)
        {'title': 'Continue Verification', 'icon': Icons.play_circle_fill, 'color': Colors.green},
    ];

    return Column(
      children: actions.map((action) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _buildActionCard(
            action['title'] as String,
            action['icon'] as IconData,
            action['color'] as Color,
          ),
        );
      }).toList(),
    );
  }

  Widget _buildActionCard(String title, IconData icon, Color color) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          if (title == 'My Assignments') {
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AssignmentsScreen()));
          } else if (title == 'Continue Verification' && _inProgressAssignment != null) {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ChangeNotifierProvider(
                  create: (context) => FieldVerificationProvider(
                    FieldVerificationRepository(context.read<ApiClient>()),
                    AssignmentRepository(context.read<ApiClient>()),
                  ),
                  child: FieldVerificationScreen(assignmentId: _inProgressAssignment!.id),
                ),
              ),
            );
          } else if (title == 'Notifications') {
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NotificationScreen()));
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 28, color: color),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
