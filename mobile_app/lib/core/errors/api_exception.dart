import '../network/api_client.dart';

class ApiException implements Exception {
  final ApiError error;
  ApiException(this.error);

  @override
  String toString() => "ApiException: [${error.code}] ${error.message}";
}

class UnauthorizedException implements Exception {
  final String message;
  UnauthorizedException(this.message);

  @override
  String toString() => "UnauthorizedException: $message";
}

class NetworkException implements Exception {
  final String message;
  NetworkException(this.message);

  @override
  String toString() => "NetworkException: $message";
}
