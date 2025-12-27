import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
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
                    GestureDetector(
                      onTap: () => Navigator.pushNamed(context, AppRoutes.editProfile),
                      child: Stack(
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
              const SizedBox(height: 24),

              _buildMenuItem(
                icon: Icons.edit_outlined,
                title: 'Edit Profile',
                onTap: () => Navigator.pushNamed(context, AppRoutes.editProfile),
              ),

              const Divider(height: 24),

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

              const Divider(height: 24),

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

              const SizedBox(height: 24),
            ],
          ),
        );
      },
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
