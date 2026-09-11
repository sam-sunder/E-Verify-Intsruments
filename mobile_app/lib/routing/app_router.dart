import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/auth/auth_service.dart';
import '../features/auth/login_screen.dart';
import 'main_screen.dart';
import '../features/business_owner/business_owner_shell.dart';
import '../features/admin/admin_shell.dart';

class AppRouter {
  static Widget generateRoute(BuildContext context) {
    final authService = Provider.of<AuthService>(context, listen: false);

    if (!authService.isAuthenticated) {
      return MaterialPageRoute(builder: (_) => const LoginScreen());
    }

    final role = authService.currentUser?.role;

    if (role == 'ADMINISTRATOR') {
      return MaterialPageRoute(builder: (_) => const AdminShell());
    }

    if (role == 'BUSINESS_OWNER') {
      return MaterialPageRoute(builder: (_) => const BusinessOwnerShell());
    }

    return MaterialPageRoute(builder: (_) => const MainScreen());
  }

  static Widget root() {
    return MaterialApp(
      title: 'e-VerifyMet',
      theme: ThemeData(
        primaryColor: const Color(0xFF008080), // Teal accent
        scaffoldBackgroundColor: const Color(0xFFF5F5F5), // Cool paper background
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0,
        ),
      ),
      home: Consumer<AuthService>(
        builder: (context, auth, _) {
          if (!auth.isAuthenticated) {
            return const LoginScreen();
          }

          final role = auth.currentUser?.role;
          if (role == 'ADMINISTRATOR') {
            return const AdminShell();
          }

          if (role == 'BUSINESS_OWNER') {
            return const BusinessOwnerShell();
          }

          return const MainScreen();
        },
      ),
    );
  }
}
