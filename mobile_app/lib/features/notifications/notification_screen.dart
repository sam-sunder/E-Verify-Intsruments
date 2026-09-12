import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/api_client.dart';
import '../notifications/notification_repository.dart';
import 'package:e_verify_met_mobile/core/config/theme_colors.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  late NotificationRepository _repository;
  List<NotificationModel> _notifications = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _repository = NotificationRepository(context.read<ApiClient>());
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      _notifications = await _repository.listNotifications(null);
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _markAsRead(String id) async {
    try {
      await _repository.markNotificationRead(id);
      setState(() {
        final index = _notifications.indexWhere((n) => n.id == id);
        if (index != -1) {
          _notifications[index] = NotificationModel(
            id: _notifications[index].id,
            type: _notifications[index].type,
            title: _notifications[index].title,
            message: _notifications[index].message,
            channel: _notifications[index].channel,
            isRead: true,
            createdAt: _notifications[index].createdAt,
            readAt: DateTime.now().toIso8601String(),
            instrument: _notifications[index].instrument,
            certificate: _notifications[index].certificate,
          );
        }
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to mark as read: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Notifications'),
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: AppColors.secondary,
        actions: [
          TextButton(
            onPressed: () async {
              await _repository.markAllNotificationsRead();
              setState(() {
                for (var i = 0; i < _notifications.length; i++) {
                  final n = _notifications[i];
                  _notifications[i] = NotificationModel(
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    channel: n.channel,
                    isRead: true,
                    createdAt: n.createdAt,
                    readAt: DateTime.now().toIso8601String(),
                    instrument: n.instrument,
                    certificate: n.certificate,
                  );
                }
              });
            },
            child: const Text('Mark all read', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadNotifications,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_errorMessage!),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadNotifications, child: const Text('Retry')),
          ],
        ),
      );
    }

    if (_notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.notifications_off_outlined, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            const Text('No notifications yet', style: TextStyle(fontSize: 16, color: Colors.grey)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _notifications.length,
      itemBuilder: (context, index) {
        final notification = _notifications[index];
        return _buildNotificationCard(notification);
      },
    );
  }

  Widget _buildNotificationCard(NotificationModel n) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: CircleAvatar(
          backgroundColor: n.isRead ? Colors.grey.shade100 : AppColors.primary.withOpacity(0.1),
          child: Icon(
            _getNotificationIcon(n.type),
            color: n.isRead ? Colors.grey : AppColors.primary,
            size: 20,
          ),
        ),
        title: Text(
          n.title,
          style: TextStyle(
            fontWeight: n.isRead ? FontWeight.normal : FontWeight.bold,
            fontSize: 15,
            color: AppColors.secondary,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(n.message, style: const TextStyle(fontSize: 13, color: Colors.black87)),
            const SizedBox(height: 8),
            Text(
              n.createdAt.substring(0, 10),
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ],
        ),
        trailing: !n.isRead
            ? IconButton(
                icon: const Icon(Icons.done_all, size: 18, color: Colors.grey),
                onPressed: () => _markAsRead(n.id),
              )
            : null,
        onTap: () => _markAsRead(n.id),
      ),
    );
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'ASSIGNMENT': return Icons.assignment;
      case 'CERTIFICATE': return Icons.card_membership;
      case 'INSTRUMENT': return Icons.settings_input_component;
      case 'COMPLIANCE': return Icons.gavel;
      default: return Icons.notifications;
    }
  }
}
