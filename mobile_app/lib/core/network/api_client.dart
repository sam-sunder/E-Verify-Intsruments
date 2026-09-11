import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/env.dart';
import '../errors/api_exception.dart';

class ApiResult<T> {
  final T data;
  ApiResult(this.data);

  factory ApiResult.fromJson(Map<String, dynamic> json, T Function(dynamic) fromJson) {
    return ApiResult((json['data'] as dynamic));
  }
}

class ApiError {
  final String code;
  final String message;
  final dynamic details;

  ApiError({required this.code, required this.message, this.details});

  factory ApiError.fromJson(Map<String, dynamic> json) {
    return ApiError(
      code: json['code'] ?? 'UNKNOWN_ERROR',
      message: json['message'] ?? 'An unexpected error occurred',
      details: json['details'],
    );
  }
}

class ApiClient {
  final http.Client _httpClient;
  String? _accessToken;

  ApiClient({http.Client? httpClient}) : _httpClient = httpClient ?? http.Client();

  void setAccessToken(String? token) {
    _accessToken = token;
  }

  Future<T> request<T>({
    required String path,
    required String method,
    Map<String, String>? queryParams,
    Map<String, String>? headers,
    dynamic body,
    T Function(dynamic) fromJson = _defaultFromJson,
  }) async {
    var fullPath = path;
    if (queryParams != null && queryParams.isNotEmpty) {
      final query = queryParams.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
      fullPath += '?$query';
    }

    final url = Uri.parse("${Env.apiUrl}$fullPath");

    final requestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...?headers,
    };

    if (_accessToken != null) {
      requestHeaders['Authorization'] = 'Bearer $_accessToken';
    }

    try {
      final response = await _httpClient.request(
        http.Request(method, url)
          ..headers.addAll(requestHeaders)
          ..body = body != null ? jsonEncode(body) : null,
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 401) {
        throw UnauthorizedException("Session expired. Please sign in again.");
      }

      final responseData = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        // Handle { "data": ... } format
        final data = responseData is Map && responseData.containsKey('data')
            ? responseData['data']
            : responseData;
        return fromJson(data);
      } else {
        // Handle { "error": { ... } } format
        final errorData = responseData is Map && responseData.containsKey('error')
            ? ApiError.fromJson(responseData['error'])
            : ApiError(code: 'SERVER_ERROR', message: responseData.toString());
        throw ApiException(errorData);
      }
    } on SocketException {
      throw NetworkException("No internet connection. Please check your network.");
    } on http.ClientException catch (e) {
      throw NetworkException("Network request failed: ${e.message}");
    } catch (e) {
      if (e is ApiException || e is UnauthorizedException || e is NetworkException) {
        rethrow;
      }
      throw ApiException(ApiError(code: 'UNKNOWN', message: e.toString()));
    }
  }

  T _defaultFromJson(dynamic json) => json as T;

  Future<T> multipartRequest<T>({
    required String path,
    required Map<String, String> fields,
    required Map<String, File> files,
    T Function(dynamic) fromJson = _defaultFromJson,
  }) async {
    final url = Uri.parse("${Env.apiUrl}$path");
    final request = http.MultipartRequest('POST', url);

    request.headers.addAll({
      'Accept': 'application/json',
    });

    if (_accessToken != null) {
      request.headers['Authorization'] = 'Bearer $_accessToken';
    }

    request.fields.addAll(fields);
    for (var entry in files.entries) {
      request.files.add(await http.MultipartFile.fromPath(entry.key, entry.value.path));
    }

    try {
      final streamedResponse = await request.send().timeout(const Duration(seconds: 60));
      final response = await http.Response.fromStream(streamedResponse);

      final responseData = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = responseData is Map && responseData.containsKey('data')
            ? responseData['data']
            : responseData;
        return fromJson(data);
      } else {
        final errorData = responseData is Map && responseData.containsKey('error')
            ? ApiError.fromJson(responseData['error'])
            : ApiError(code: 'SERVER_ERROR', message: responseData.toString());
        throw ApiException(errorData);
      }
    } on SocketException {
      throw NetworkException("No internet connection.");
    } catch (e) {
      if (e is ApiException || e is UnauthorizedException || e is NetworkException) {
        rethrow;
      }
      throw ApiException(ApiError(code: 'UNKNOWN', message: e.toString()));
    }
  }
}
