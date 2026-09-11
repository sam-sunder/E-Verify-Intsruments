import '../core/network/api_client.dart';

class NotificationModel {
  final String id;
  final String type;
  final String title;
  final String message;
  final String channel;
  final bool isRead;
  final String createdAt;
  final String? readAt;
  final Map<String, dynamic>? instrument;
  final Map<String, dynamic>? certificate;

  NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.channel,
    required this.isRead,
    required this.createdAt,
    this.readAt,
    this.instrument,
    this.certificate,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'],
      type: json['type'],
      title: json['title'],
      message: json['message'],
      channel: json['channel'],
      isRead: json['isRead'],
      createdAt: json['createdAt'],
      readAt: json['readAt'],
      instrument: json['instrument'],
      certificate: json['certificate'],
    );
  }
}

class NotificationRepository {
  final ApiClient _apiClient;

  NotificationRepository(this._apiClient);

  Future<List<NotificationModel>> listNotifications(Map<String, String>? params) async {
    final response = await _apiClient.request<Map<String, dynamic>>(
      path: '/notifications',
      method: 'GET',
      queryParams: params,
    );
    final data = response['data'] as List;
    return data.map((json) => NotificationModel.fromJson(json)).toList();
  }

  Future<void> markNotificationRead(String notificationId) async {
    await _apiClient.request(
      path: '/notifications/$notificationId/read',
      method: 'POST',
    );
  }

  Future<void> markAllNotificationsRead() async {
    await _apiClient.request(
      path: '/notifications/read-all',
      method: 'POST',
    );
  }
}
