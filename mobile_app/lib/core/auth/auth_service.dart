import 'package:flutter/material.dart';
import '../network/api_client.dart';
import '../storage/secure_storage.dart';

class UserProfile {
  final String id;
  final String email;
  final String fullName;
  final String role;
  final String status;

  UserProfile({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.status,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'],
      email: json['email'],
      fullName: json['fullName'],
      role: json['role'],
      status: json['status'],
    );
  }
}

class AuthService extends ChangeNotifier {
  final ApiClient _apiClient;
  final SecureStorage _storage;

  UserProfile? _currentUser;
  bool _isAuthenticated = false;

  AuthService(this._apiClient, this._storage);

  UserProfile? get currentUser => _currentUser;
  bool get isAuthenticated => _isAuthenticated;

  Future<void> login(String email, String password) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/auth/login',
      method: 'POST',
      body: {'email': email, 'password': password},
    );

    final userJson = response['user'];
    final accessToken = response['accessToken'] as String?;
    final refreshToken = response['refreshToken'] as String?;

    if (accessToken != null) {
      await _storage.saveAccessToken(accessToken);
      _apiClient.setAccessToken(accessToken);
    }
    if (refreshToken != null) {
      await _storage.saveRefreshToken(refreshToken);
    }

    _currentUser = UserProfile.fromJson(userJson);
    _isAuthenticated = true;
    notifyListeners();
  }

  Future<void> logout() async {
    try {
      await _apiClient.request('/auth/logout', method: 'POST');
    } catch (_) {
      // Logout should succeed locally even if API call fails
    } finally {
      await _storage.clearAuth();
      _apiClient.setAccessToken(null);
      _currentUser = null;
      _isAuthenticated = false;
      notifyListeners();
    }
  }

  Future<void> checkSession() async {
    final token = await _storage.getAccessToken();
    if (token == null) {
      _isAuthenticated = false;
      notifyListeners();
      return;
    }

    _apiClient.setAccessToken(token);
    try {
      final response = await _apiClient.request<Map<String, dynamic>>(
        path: '/me',
        method: 'GET',
      );
      _currentUser = UserProfile.fromJson(response);
      _isAuthenticated = true;
    } catch (e) {
      await _storage.clearAuth();
      _apiClient.setAccessToken(null);
      _currentUser = null;
      _isAuthenticated = false;
    }
    notifyListeners();
  }
}
