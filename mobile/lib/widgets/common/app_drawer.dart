import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notifications_provider.dart';
import '../../providers/chat_provider.dart';

class AppDrawer extends StatelessWidget {
  final int currentIndex;
  final Function(int) onNavigate;

  const AppDrawer({
    super.key,
    required this.currentIndex,
    required this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: Consumer3<AuthProvider, NotificationsProvider, ChatProvider>(
        builder: (context, auth, notifications, chat, _) {
          final user = auth.user;

          return SafeArea(
            child: Column(
              children: [
                if (user != null) _buildHeader(context, user),
                const Divider(height: 1),
                Expanded(
                  child: ListView(
                    padding: EdgeInsets.zero,
                    children: [
                      _buildNavItem(
                        context: context,
                        icon: Icons.home_outlined,
                        activeIcon: Icons.home,
                        title: 'Dashboard',
                        isActive: currentIndex == 0,
                        onTap: () {
                          Navigator.pop(context);
                          onNavigate(0);
                        },
                      ),
                      _buildNavItem(
                        context: context,
                        icon: Icons.shopping_basket_outlined,
                        activeIcon: Icons.shopping_basket,
                        title: 'My Listed Items',
                        onTap: () {
                          Navigator.pop(context);
                          Navigator.pushNamed(context, AppRoutes.myListings);
                        },
                      ),
                      _buildNavItem(
                        context: context,
                        icon: Icons.list_alt_outlined,
                        activeIcon: Icons.list_alt,
                        title: 'My Requests',
                        isActive: currentIndex == 1,
                        onTap: () {
                          Navigator.pop(context);
                          onNavigate(1);
                        },
                      ),
                      _buildNavItem(
                        context: context,
                        icon: Icons.chat_bubble_outline,
                        activeIcon: Icons.chat_bubble,
                        title: 'Messages',
                        badge: chat.unreadCount > 0 ? chat.unreadCount : null,
                        isActive: currentIndex == 2,
                        onTap: () {
                          Navigator.pop(context);
                          onNavigate(2);
                        },
                      ),
                      _buildNavItem(
                        context: context,
                        icon: Icons.notifications_outlined,
                        activeIcon: Icons.notifications,
                        title: 'Pickups',
                        badge: notifications.unreadCount > 0 ? notifications.unreadCount : null,
                        onTap: () {
                          Navigator.pop(context);
                          Navigator.pushNamed(context, AppRoutes.notifications);
                        },
                      ),
                      _buildNavItem(
                        context: context,
                        icon: Icons.bar_chart_outlined,
                        activeIcon: Icons.bar_chart,
                        title: 'Impact',
                        onTap: () {
                          Navigator.pop(context);
                          Navigator.pushNamed(context, AppRoutes.analytics);
                        },
                      ),
                      if (user?.isAdmin == true) ...[
                        const Divider(),
                        _buildNavItem(
                          context: context,
                          icon: Icons.admin_panel_settings_outlined,
                          activeIcon: Icons.admin_panel_settings,
                          title: 'Admin',
                          color: AppColors.error,
                          onTap: () {
                            Navigator.pop(context);
                            Navigator.pushNamed(context, AppRoutes.adminDashboard);
                          },
                        ),
                      ],
                      const Divider(),
                      _buildNavItem(
                        context: context,
                        icon: Icons.person_outline,
                        activeIcon: Icons.person,
                        title: 'Profile',
                        isActive: currentIndex == 3,
                        onTap: () {
                          Navigator.pop(context);
                          onNavigate(3);
                        },
                      ),
                      _buildNavItem(
                        context: context,
                        icon: Icons.settings_outlined,
                        activeIcon: Icons.settings,
                        title: 'Settings',
                        onTap: () {
                          Navigator.pop(context);
                          Navigator.pushNamed(context, AppRoutes.settings);
                        },
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                _buildLogoutTile(context, auth),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(BuildContext context, dynamic user) {
    return InkWell(
      onTap: () {
        Navigator.pop(context);
        onNavigate(3);
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundImage: user.profileImage != null
                  ? CachedNetworkImageProvider(user.profileImage!)
                  : null,
              child: user.profileImage == null
                  ? Text(
                      user.name[0].toUpperCase(),
                      style: const TextStyle(fontSize: 20),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Icon(
                        Icons.star,
                        size: 14,
                        color: AppColors.accent,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${user.rating.toStringAsFixed(1)}',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      if (user.isStoreOwner) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.store.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'Store',
                            style: TextStyle(
                              fontSize: 10,
                              color: AppColors.store,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required BuildContext context,
    required IconData icon,
    required IconData activeIcon,
    required String title,
    required VoidCallback onTap,
    bool isActive = false,
    int? badge,
    Color? color,
  }) {
    return ListTile(
      leading: Badge(
        isLabelVisible: badge != null && badge > 0,
        label: badge != null ? Text('$badge') : null,
        child: Icon(
          isActive ? activeIcon : icon,
          color: color ?? (isActive ? AppColors.primary : AppColors.textPrimary),
        ),
      ),
      title: Text(
        title,
        style: TextStyle(
          color: color ?? (isActive ? AppColors.primary : AppColors.textPrimary),
          fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
      selected: isActive,
      selectedTileColor: AppColors.primary.withOpacity(0.08),
      onTap: onTap,
    );
  }

  Widget _buildLogoutTile(BuildContext context, AuthProvider auth) {
    return ListTile(
      leading: const Icon(Icons.logout, color: AppColors.error),
      title: const Text(
        'Logout',
        style: TextStyle(color: AppColors.error),
      ),
      onTap: () async {
        final confirm = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Sign Out'),
            content: const Text('Are you sure you want to sign out?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Sign Out'),
              ),
            ],
          ),
        );

        if (confirm == true && context.mounted) {
          Navigator.pop(context);
          await auth.logout();
          Navigator.pushReplacementNamed(context, AppRoutes.login);
        }
      },
    );
  }
}
