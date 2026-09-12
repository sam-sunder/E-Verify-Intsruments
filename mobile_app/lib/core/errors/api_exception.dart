import '../network/api_client.dart';
// Removed import of ApiClient to avoid circular dependency if ApiClient uses ApiException

class ApiException implements Exception {
  final ApiError error;
  ApiException(this.error);

  @override
  String toString() => "ApiException: [${error.code}] ${error.message}";
}

class UnauthorizedException extends ApiException {
  UnauthorizedException(String message) : super(ApiError(code: 'UNAUTHORIZED', message: message));
}

class NetworkException extends ApiException {
  NetworkException(String message) : super(ApiError(code: 'NETWORK_ERROR', message: message));
}
