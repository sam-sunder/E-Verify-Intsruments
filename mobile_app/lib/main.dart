import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/network/api_client.dart';
import 'core/storage/secure_storage.dart';
import 'core/auth/auth_service.dart';
import 'routing/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final apiClient = ApiClient();
  final secureStorage = SecureStorage();
  final authService = AuthService(apiClient, secureStorage);

  // Check existing session on startup
  await authService.checkSession();

  runApp(
    MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: apiClient),
        Provider<SecureStorage>.value(value: secureStorage),
        ChangeNotifierProvider<AuthService>.value(value: authService),
      ],
      child: AppRouter.root(),
    ),
  );
}
