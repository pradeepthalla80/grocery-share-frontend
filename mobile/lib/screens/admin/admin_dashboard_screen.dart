import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../../services/admin_service.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final AdminService _adminService = AdminService();
  AdminStatsResult? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _isLoading = true);
    _stats = await _adminService.getDashboardStats();
    setState(() => _isLoading = false);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Users'),
            Tab(text: 'Items'),
          ],
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: AppColors.primary,
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(),
                _buildUsersTab(),
                _buildItemsTab(),
              ],
            ),
    );
  }

  Widget _buildOverviewTab() {
    if (_stats == null) {
      return const Center(child: Text('Unable to load stats'));
    }

    return RefreshIndicator(
      onRefresh: _loadStats,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: [
                _buildStatCard(
                  'Total Users',
                  _stats!.totalUsers.toString(),
                  Icons.people,
                  AppColors.primary,
                ),
                _buildStatCard(
                  'Total Items',
                  _stats!.totalItems.toString(),
                  Icons.shopping_basket,
                  AppColors.success,
                ),
                _buildStatCard(
                  'Active Items',
                  _stats!.activeItems.toString(),
                  Icons.check_circle,
                  AppColors.info,
                ),
                _buildStatCard(
                  'Completed',
                  _stats!.completedExchanges.toString(),
                  Icons.handshake,
                  AppColors.accent,
                ),
                _buildStatCard(
                  'Store Owners',
                  _stats!.storeOwners.toString(),
                  Icons.store,
                  AppColors.store,
                ),
                _buildStatCard(
                  'Total Requests',
                  _stats!.totalRequests.toString(),
                  Icons.list_alt,
                  AppColors.warning,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUsersTab() {
    return const Center(
      child: Text('Users management coming soon'),
    );
  }

  Widget _buildItemsTab() {
    return const Center(
      child: Text('Items management coming soon'),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
