import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notifications_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          Consumer<NotificationsProvider>(
            builder: (context, provider, _) {
              return Badge(
                isLabelVisible: provider.hasUnread,
                label: Text('${provider.unreadCount}'),
                child: IconButton(
                  icon: const Icon(Icons.notifications_outlined),
                  onPressed: () => Navigator.pushNamed(context, AppRoutes.notifications),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.pushNamed(context, AppRoutes.settings),
          ),
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          final user = auth.user;
          if (user == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Center(
                  child: Column(
                    children: [
                      Stack(
                        children: [
                          CircleAvatar(
                            radius: 50,
                            backgroundImage: user.profileImage != null
                                ? CachedNetworkImageProvider(user.profileImage!)
                                : null,
                            child: user.profileImage == null
                                ? Text(
                                    user.name[0].toUpperCase(),
                                    style: const TextStyle(fontSize: 36),
                                  )
                                : null,
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.edit,
                                color: Colors.white,
                                size: 16,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        user.name,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user.email,
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.star, color: AppColors.accent, size: 20),
                          const SizedBox(width: 4),
                          Text(
                            '${user.rating.toStringAsFixed(1)} (${user.totalRatings} ratings)',
                            style: const TextStyle(color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                      if (user.isStoreOwner) ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.store.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.store,
                                color: AppColors.store,
                                size: 16,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                user.storeName ?? 'Store Owner',
                                style: const TextStyle(
                                  color: AppColors.store,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                _buildMenuItem(
                  icon: Icons.edit_outlined,
                  title: 'Edit Profile',
                  onTap: () => Navigator.pushNamed(context, AppRoutes.editProfile),
                ),
                _buildMenuItem(
                  icon: Icons.shopping_basket_outlined,
                  title: 'My Listings',
                  onTap: () => Navigator.pushNamed(context, AppRoutes.myListings),
                ),
                _buildMenuItem(
                  icon: Icons.list_alt_outlined,
                  title: 'My Requests',
                  onTap: () => Navigator.pushNamed(context, AppRoutes.myRequests),
                ),
                
                const Divider(height: 32),

                if (user.isStoreOwner)
                  _buildMenuItem(
                    icon: Icons.store,
                    title: 'Store Dashboard',
                    color: AppColors.store,
                    onTap: () => Navigator.pushNamed(context, AppRoutes.storeDashboard),
                  )
                else
                  _buildMenuItem(
                    icon: Icons.store_outlined,
                    title: 'Become a Store Owner',
                    onTap: () => Navigator.pushNamed(context, AppRoutes.storeOnboarding),
                  ),

                _buildMenuItem(
                  icon: Icons.payment_outlined,
                  title: 'Seller Payments',
                  onTap: () => Navigator.pushNamed(context, AppRoutes.sellerOnboarding),
                ),

                _buildMenuItem(
                  icon: Icons.bar_chart_outlined,
                  title: 'Community Impact',
                  onTap: () => Navigator.pushNamed(context, AppRoutes.analytics),
                ),

                if (user.isAdmin) ...[
                  const Divider(height: 32),
                  _buildMenuItem(
                    icon: Icons.admin_panel_settings,
                    title: 'Admin Dashboard',
                    color: AppColors.error,
                    onTap: () => Navigator.pushNamed(context, AppRoutes.adminDashboard),
                  ),
                ],

                const Divider(height: 32),

                _buildMenuItem(
                  icon: Icons.description_outlined,
                  title: 'Terms of Use',
                  onTap: () => Navigator.pushNamed(context, AppRoutes.terms),
                ),
                _buildMenuItem(
                  icon: Icons.privacy_tip_outlined,
                  title: 'Privacy Policy',
                  onTap: () => Navigator.pushNamed(context, AppRoutes.privacy),
                ),

                const SizedBox(height: 16),

                OutlinedButton.icon(
                  onPressed: () async {
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
                      await auth.logout();
                      Navigator.pushReplacementNamed(context, AppRoutes.login);
                    }
                  },
                  icon: const Icon(Icons.logout),
                  label: const Text('Sign Out'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color? color,
  }) {
    return ListTile(
      leading: Icon(icon, color: color ?? AppColors.textPrimary),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
      onTap: onTap,
    );
  }
}
