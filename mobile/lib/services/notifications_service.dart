import '../models/notification.dart';
import 'api_client.dart';

class NotificationsService {
  final ApiClient _api = ApiClient();
  
  Future<NotificationsResult> getNotifications({int page = 1, int limit = 20}) async {
    try {
      final response = await _api.get(
        '/notifications',
        queryParameters: {'page': page, 'limit': limit},
      );
      
      final notifications = (response.data['notifications'] as List<dynamic>)
          .map((n) => AppNotification.fromJson(n))
          .toList();
      
      return NotificationsResult(
        success: true,
        notifications: notifications,
        total: response.data['total'],
        unreadCount: response.data['unreadCount'] ?? 0,
      );
    } catch (e) {
      return NotificationsResult(success: false, error: e.toString());
    }
  }
  
  Future<int> getUnreadCount() async {
    try {
      final response = await _api.get('/notifications/unread-count');
      return response.data['count'] ?? 0;
    } catch (_) {
      return 0;
    }
  }
  
  Future<bool> markAsRead(String notificationId) async {
    try {
      await _api.patch('/notifications/$notificationId/read');
      return true;
    } catch (_) {
      return false;
    }
  }
  
  Future<bool> markAllAsRead() async {
    try {
      await _api.post('/notifications/mark-all-read');
      return true;
    } catch (_) {
      return false;
    }
  }
  
  Future<bool> deleteNotification(String id) async {
    try {
      await _api.delete('/notifications/$id');
      return true;
    } catch (_) {
      return false;
    }
  }
}

class NotificationsResult {
  final bool success;
  final List<AppNotification>? notifications;
  final int? total;
  final int unreadCount;
  final String? error;
  
  NotificationsResult({
    required this.success,
    this.notifications,
    this.total,
    this.unreadCount = 0,
    this.error,
  });
}
