import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../../services/analytics_service.dart';
import '../../models/analytics.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  final AnalyticsService _analyticsService = AnalyticsService();
  AnalyticsData? _data;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final result = await _analyticsService.getCommunityImpact();
    setState(() {
      _data = result.data;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Community Impact'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _data == null
              ? const Center(child: Text('Unable to load analytics'))
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Together, we\'re making a difference',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'See how our community is reducing food waste and helping neighbors.',
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 24),

                        GridView.count(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisCount: 2,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: 1.2,
                          children: [
                            _buildStatCard(
                              'Total Members',
                              _formatNumber(_data!.totalMembers),
                              Icons.people,
                              AppColors.primary,
                            ),
                            _buildStatCard(
                              'Items Shared',
                              _formatNumber(_data!.itemsShared),
                              Icons.shopping_basket,
                              AppColors.success,
                            ),
                            _buildStatCard(
                              'Requests Fulfilled',
                              _formatNumber(_data!.requestsFulfilled),
                              Icons.check_circle,
                              AppColors.info,
                            ),
                            _buildStatCard(
                              'Food Saved',
                              '${_data!.foodSavedLbs.toStringAsFixed(0)} lbs',
                              Icons.eco,
                              AppColors.secondary,
                            ),
                            _buildStatCard(
                              'Active Communities',
                              _formatNumber(_data!.activeCommunities),
                              Icons.location_city,
                              AppColors.accent,
                            ),
                            _buildStatCard(
                              'Open Requests',
                              _formatNumber(_data!.openRequests),
                              Icons.list_alt,
                              AppColors.warning,
                            ),
                          ],
                        ),
                        const SizedBox(height: 32),

                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            children: [
                              const Icon(
                                Icons.volunteer_activism,
                                color: AppColors.primary,
                                size: 48,
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'Every item shared makes a difference',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'By sharing surplus groceries, you\'re helping reduce food waste and supporting your neighbors in need.',
                                style: TextStyle(color: AppColors.textSecondary),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 32),
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

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }
}
