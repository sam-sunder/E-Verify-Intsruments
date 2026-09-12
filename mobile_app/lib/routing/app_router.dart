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
      return const LoginScreen();
    }

    final role = authService.currentUser?.role;

    if (role == 'ADMINISTRATOR') {
      return const AdminShell();
    }

    if (role == 'BUSINESS_OWNER') {
      return const BusinessOwnerShell();
    }

    return const MainScreen();
  }

  static Widget root() {
    return MaterialApp(
      title: 'e-VerifyMet',
      theme: ThemeData(
        useMaterial3: true,
        primaryColor: const Color(0xFF0070FF),
        scaffoldBackgroundColor: const Color(0xFFF5F5F5),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0070FF),
          primary: const Color(0xFF0070FF),
          secondary: const Color(0xFF333333),
          surface: const Color(0xFFFFFFFF),
          error: const Color(0xFFD92D20),
          onPrimary: Colors.white,
          onSecondary: Colors.white,
          onSurface: const Color(0xFF333333),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF333333),
          elevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(
            color: Color(0xFF333333),
            fontSize: 18,
            fontWeight: FontWeight.w600,
            fontFamily: 'Manrope',
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF333333),
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(2)),
            textStyle: const TextStyle(
              fontFamily: 'Manrope',
              fontWeight: FontWeight.w600,
              fontSize: 16,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF333333),
            side: const BorderSide(color: Color(0xFFE5E7EB)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(2)),
            textStyle: const TextStyle(
              fontFamily: 'Manrope',
              fontWeight: FontWeight.w600,
              fontSize: 16,
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(2),
            borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(2),
            borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(2),
            borderSide: const BorderSide(color: Color(0xFF0070FF)),
          ),
          labelStyle: const TextStyle(color: Color(0xFF333333), fontFamily: 'Manrope'),
        ),
        textTheme: const TextTheme(
          headlineMedium: TextStyle(
            fontFamily: 'Ratio',
            fontSize: 21,
            fontWeight: FontWeight.w400,
            color: Color(0xFF333333),
          ),
          bodyLarge: TextStyle(
            fontFamily: 'Manrope',
            fontSize: 18,
            color: Color(0xFF333333),
          ),
          bodyMedium: TextStyle(
            fontFamily: 'Manrope',
            fontSize: 16,
            color: Color(0xFF333333),
          ),
          bodySmall: TextStyle(
            fontFamily: 'Manrope',
            fontSize: 14,
            color: Color(0xFF333333),
          ),
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
