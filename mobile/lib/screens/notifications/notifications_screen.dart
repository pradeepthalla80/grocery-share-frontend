import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../providers/notifications_provider.dart';
import '../../widgets/common/empty_state.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    context.read<NotificationsProvider>().fetchNotifications();
  }

  void _handleNotificationTap(dynamic notification) {
    final notificationsProvider = context.read<NotificationsProvider>();
    
    if (!notification.isRead) {
      notificationsProvider.markAsRead(notification.id);
    }

    if (notification.itemId != null) {
      Navigator.pushNamed(
        context,
        AppRoutes.itemDetail,
        arguments: {'itemId': notification.itemId},
      );
    } else if (notification.conversationId != null) {
      Navigator.pushNamed(
        context,
        AppRoutes.chat,
        arguments: {'conversationId': notification.conversationId},
      );
    } else if (notification.requestId != null) {
      Navigator.pushNamed(
        context,
        AppRoutes.requestDetail,
        arguments: {'requestId': notification.requestId},
      );
    }
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'message':
        return Icons.chat_bubble;
      case 'pickup_request':
        return Icons.local_shipping;
      case 'item_request':
        return Icons.list_alt;
      case 'rating':
        return Icons.star;
      case 'offer':
        return Icons.local_offer;
      default:
        return Icons.notifications;
    }
  }

  Color _getNotificationColor(String type) {
    switch (type) {
      case 'message':
        return AppColors.info;
      case 'pickup_request':
        return AppColors.primary;
      case 'item_request':
        return AppColors.accent;
      case 'rating':
        return AppColors.warning;
      case 'offer':
        return AppColors.success;
      default:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          Consumer<NotificationsProvider>(
            builder: (context, provider, _) {
              if (provider.hasUnread) {
                return TextButton(
                  onPressed: () => provider.markAllAsRead(),
                  child: const Text('Mark all read'),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<NotificationsProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.notifications.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.notifications.isEmpty) {
            return const EmptyState(
              icon: Icons.notifications_none,
              title: 'No Notifications',
              message: 'You\'re all caught up! New notifications will appear here.',
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.fetchNotifications(),
            child: ListView.builder(
              itemCount: provider.notifications.length,
              itemBuilder: (context, index) {
                final notification = provider.notifications[index];
                final iconColor = _getNotificationColor(notification.type);

                return Dismissible(
                  key: Key(notification.id),
                  direction: DismissDirection.endToStart,
                  onDismissed: (_) => provider.deleteNotification(notification.id),
                  background: Container(
                    color: AppColors.error,
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 16),
                    child: const Icon(Icons.delete, color: Colors.white),
                  ),
                  child: ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: iconColor.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _getNotificationIcon(notification.type),
                        color: iconColor,
                        size: 20,
                      ),
                    ),
                    title: Text(
                      notification.title,
                      style: TextStyle(
                        fontWeight: notification.isRead
                            ? FontWeight.normal
                            : FontWeight.bold,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          notification.message,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: notification.isRead
                                ? AppColors.textMuted
                                : AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _formatTime(notification.createdAt),
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                    trailing: !notification.isRead
                        ? Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          )
                        : null,
                    onTap: () => _handleNotificationTap(notification),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inDays > 7) {
      return DateFormat('MMM d').format(time);
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}
