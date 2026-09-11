import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dashboard/dashboard_screen.dart';
import 'applications/application_list_screen.dart';
import 'assignments/assignment_list_screen.dart';
import 'certificates/certificate_list_screen.dart';
import 'instruments/instrument_list_screen.dart';
import 'users/user_list_screen.dart';
import 'compliance/compliance_screen.dart';
import 'audit/audit_log_screen.dart';
import 'notifications/notification_screen.dart';
import 'profile/profile_screen.dart';

class AdminShell extends StatefulWidget {
  const AdminShell({super.key});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _selectedIndex = 0;

  final List<Widget> _mainPages = [
    const DashboardScreen(),
    const ApplicationListScreen(),
    const AssignmentListScreen(),
    const CertificateListScreen(),
    const MoreMenuScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _mainPages[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.teal,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment), label: 'Apps'),
          BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Assign'),
          BottomNavigationBarItem(icon: Icon(Icons.card_membership), label: 'Certs'),
          BottomNavigationBarItem(icon: Icon(Icons.more_horiz), label: 'More'),
        ],
      ),
    );
  }
}

class MoreMenuScreen extends StatelessWidget {
  const MoreMenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Administrator Options')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _buildMenuTile(context, 'Instruments', Icons.settings_input_component, const InstrumentListScreen()),
          _buildMenuTile(context, 'Compliance', Icons.gavel, const ComplianceScreen()),
          _buildMenuTile(context, 'User Management', Icons.manage_accounts, const UserListScreen()),
          _buildMenuTile(context, 'Audit Trail', Icons.history, const AuditLogScreen()),
          _buildMenuTile(context, 'Notifications', Icons.notifications, const NotificationScreen()),
          _buildMenuTile(context, 'My Profile', Icons.person, const ProfileScreen()),
        ],
      ),
    );
  }

  Widget _buildMenuTile(BuildContext context, String title, IconData icon, Widget destination) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade300),
      ),
      child: ListTile(
        leading: Icon(icon, color: Colors.teal),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => destination)),
      ),
    );
  }
}
