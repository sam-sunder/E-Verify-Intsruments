import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../features/business_owner/dashboard/dashboard_screen.dart';
import '../../features/instruments/instrument_list_screen.dart';
import '../../features/applications/application_list_screen.dart';
import '../../features/certificates/certificate_list_screen.dart';
import '../../features/notifications/notification_screen.dart';
import 'package:e_verify_met_mobile/core/config/theme_colors.dart';

class BusinessOwnerShell extends StatefulWidget {
  const BusinessOwnerShell({super.key});

  @override
  State<BusinessOwnerShell> createState() => _BusinessOwnerShellState();
}

class _BusinessOwnerShellState extends State<BusinessOwnerShell> {
  int _selectedIndex = 0;

  final List<Widget> _pages = [
    const DashboardScreen(),
    const InstrumentListScreen(),
    const ApplicationListScreen(),
    const CertificateListScreen(),
    const NotificationScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.settings_input_component), label: 'Instruments'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment), label: 'Apps'),
          BottomNavigationBarItem(icon: Icon(Icons.card_membership), label: 'Certs'),
          BottomNavigationBarItem(icon: Icon(Icons.notifications), label: 'Alerts'),
        ],
      ),
    );
  }
}