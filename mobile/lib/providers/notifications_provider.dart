import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

import '../config/app_config.dart';
import '../models/notification.dart';
import '../services/notifications_service.dart';
import 'auth_provider.dart';

class NotificationsProvider with ChangeNotifier {
  final NotificationsService _notificationsService = NotificationsService();
  
  AuthProvider? _authProvider;
  
  List<AppNotification> _notifications = [];
  bool _isLoading = false;
  String? _error;
  int _unreadCount = 0;
  
  Timer? _pollingTimer;
  
  List<AppNotification> get notifications => _notifications;
  List<AppNotification> get unreadNotifications =>
      _notifications.where((n) => !n.isRead).toList();
  
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get unreadCount => _unreadCount;
  bool get hasUnread => _unreadCount > 0;
  
  void updateAuth(AuthProvider auth) {
    _authProvider = auth;
    if (auth.isAuthenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        startPolling();
      });
    } else {
      stopPolling();
      _notifications = [];
      _unreadCount = 0;
    }
  }
  
  void startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(
      Duration(seconds: AppConfig.notificationPollingInterval),
      (_) => fetchUnreadCount(),
    );
    fetchUnreadCount();
  }
  
  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }
  
  Future<void> fetchNotifications() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    final result = await _notificationsService.getNotifications();
    
    _isLoading = false;
    
    if (result.success && result.notifications != null) {
      _notifications = result.notifications!;
      _unreadCount = result.unreadCount;
    } else {
      _error = result.error;
    }
    
    notifyListeners();
  }
  
  Future<void> fetchUnreadCount() async {
    final count = await _notificationsService.getUnreadCount();
    if (_unreadCount != count) {
      _unreadCount = count;
      notifyListeners();
    }
  }
  
  Future<bool> markAsRead(String notificationId) async {
    final success = await _notificationsService.markAsRead(notificationId);
    
    if (success) {
      final index = _notifications.indexWhere((n) => n.id == notificationId);
      if (index != -1) {
        final notification = _notifications[index];
        _notifications[index] = AppNotification(
          id: notification.id,
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: true,
          createdAt: notification.createdAt,
        );
        _unreadCount = _unreadCount > 0 ? _unreadCount - 1 : 0;
        notifyListeners();
      }
    }
    
    return success;
  }
  
  Future<bool> markAllAsRead() async {
    final success = await _notificationsService.markAllAsRead();
    
    if (success) {
      _notifications = _notifications.map((n) => AppNotification(
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        isRead: true,
        createdAt: n.createdAt,
      )).toList();
      _unreadCount = 0;
      notifyListeners();
    }
    
    return success;
  }
  
  Future<bool> deleteNotification(String id) async {
    final success = await _notificationsService.deleteNotification(id);
    
    if (success) {
      final notification = _notifications.firstWhere((n) => n.id == id);
      if (!notification.isRead) {
        _unreadCount = _unreadCount > 0 ? _unreadCount - 1 : 0;
      }
      _notifications.removeWhere((n) => n.id == id);
      notifyListeners();
    }
    
    return success;
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
  
  @override
  void dispose() {
    stopPolling();
    super.dispose();
  }
}
