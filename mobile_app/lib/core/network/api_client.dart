import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:flutter/foundation.dart';
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
  late final Dio _dio;
  final CookieJar _cookieJar = CookieJar();
  String? _accessToken;
  void Function()? onUnauthorized;
  Future<String?> Function()? tokenProvider;

  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: Env.apiUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        extra: {
          'withCredentials': true,
        },
      ),
    );

    // Enable cookie management only for non-web platforms.
    // Browsers handle cookies automatically; adding CookieManager on web can cause issues.
    if (!kIsWeb) {
      _dio.interceptors.add(CookieManager(_cookieJar));
    }

    // Add interceptor for Auth headers and 401 handling
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        String? token = _accessToken;
        if (token == null && tokenProvider != null) {
          token = await tokenProvider!();
        }

        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        if (e.response?.statusCode == 401) {
          // Avoid logout loop on logout request
          final path = e.requestOptions.path;
          if (path != null && !path.contains('/auth/logout')) {
            onUnauthorized?.call();
          }
          return handler.next(
            DioException(
              requestOptions: e.requestOptions,
              error: UnauthorizedException("Session expired. Please sign in again."),
            ),
          );
        }
        return handler.next(e);
      },
    ));
  }

  void setAccessToken(String? token) {
    _accessToken = token;
  }

  Future<T> request<T>({
    required String path,
    required String method,
    Map<String, String>? queryParams,
    Map<String, String>? headers,
    dynamic body,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.request(
        path,
        data: body,
        queryParameters: queryParams,
        options: Options(
          method: method,
          headers: headers,
        ),
      );

      final responseData = response.data;

      if (responseData is Map && responseData.containsKey('data')) {
        final data = responseData['data'];
        return fromJson != null ? fromJson(data) : (data as T);
      } else {
        return fromJson != null ? fromJson(responseData) : (responseData as T);
      }
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(ApiError(code: 'UNKNOWN', message: e.toString()));
    }
  }

  Future<T> multipartRequest<T>({
    required String path,
    required Map<String, String> fields,
    required Map<String, File> files,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final Map<String, dynamic> data = Map.from(fields);
      for (var entry in files.entries) {
        data[entry.key] = await MultipartFile.fromFile(entry.value.path);
      }
      final formData = FormData.fromMap(data);

      final response = await _dio.post(
        path,
        data: formData,
      );

      final responseData = response.data;

      if (responseData is Map && responseData.containsKey('data')) {
        final data = responseData['data'];
        return fromJson != null ? fromJson(data) : (data as T);
      } else {
        return fromJson != null ? fromJson(responseData) : (responseData as T);
      }
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(ApiError(code: 'UNKNOWN', message: e.toString()));
    }
  }

  ApiException _handleDioError(DioException e) {
    if (e.error is UnauthorizedException) {
      return e.error as UnauthorizedException;
    }

    final response = e.response;
    if (response != null) {
      final responseData = response.data;
      if (responseData is Map && responseData.containsKey('error')) {
        return ApiException(ApiError.fromJson(responseData['error']));
      }
      return ApiException(ApiError(
        code: 'SERVER_ERROR',
        message: response.statusMessage ?? 'Unknown Error',
        details: responseData,
      ));
    }

    if (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout) {
      return NetworkException("No internet connection. Please check your network.");
    }

    return ApiException(ApiError(code: 'UNKNOWN', message: e.message ?? 'Unknown Error'));
  }
}
