import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../providers/requests_provider.dart';
import '../../providers/location_provider.dart';
import '../../widgets/requests/request_card.dart';
import '../../widgets/common/empty_state.dart';

class RequestsScreen extends StatefulWidget {
  const RequestsScreen({super.key});

  @override
  State<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends State<RequestsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  void _loadData() {
    if (!mounted) return;
    final locationProvider = context.read<LocationProvider>();
    final requestsProvider = context.read<RequestsProvider>();
    
    requestsProvider.fetchItemRequests(
      latitude: locationProvider.latitude,
      longitude: locationProvider.longitude,
    );
    requestsProvider.fetchPickupRequests();
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
        title: const Text('Requests'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Community Requests'),
            Tab(text: 'My Pickups'),
          ],
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: AppColors.primary,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildCommunityRequests(),
          _buildMyPickups(),
        ],
      ),
    );
  }

  Widget _buildCommunityRequests() {
    return Consumer<RequestsProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.itemRequests.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.itemRequests.isEmpty) {
          return EmptyState(
            icon: Icons.list_alt_outlined,
            title: 'No Requests Yet',
            message: 'Post a request for items you need from your community.',
            actionLabel: 'Post Request',
            onAction: () => Navigator.pushNamed(context, AppRoutes.addRequest),
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            final locationProvider = context.read<LocationProvider>();
            await provider.fetchItemRequests(
              latitude: locationProvider.latitude,
              longitude: locationProvider.longitude,
              refresh: true,
            );
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: provider.itemRequests.length,
            itemBuilder: (context, index) {
              final request = provider.itemRequests[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: RequestCard(
                  request: request,
                  onTap: () {
                    Navigator.pushNamed(
                      context,
                      AppRoutes.requestDetail,
                      arguments: {'requestId': request.id},
                    );
                  },
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildMyPickups() {
    return Consumer<RequestsProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.pickupRequests.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.pickupRequests.isEmpty) {
          return const EmptyState(
            icon: Icons.local_shipping_outlined,
            title: 'No Pickup Requests',
            message: 'Your pickup requests will appear here when you request items.',
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            await provider.fetchPickupRequests();
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (provider.pendingPickups.isNotEmpty) ...[
                const Text(
                  'Pending',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                ...provider.pendingPickups.map((pickup) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _buildPickupCard(pickup),
                )),
                const SizedBox(height: 16),
              ],
              if (provider.activePickups.isNotEmpty) ...[
                const Text(
                  'Ready for Pickup',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                ...provider.activePickups.map((pickup) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _buildPickupCard(pickup),
                )),
                const SizedBox(height: 16),
              ],
              if (provider.completedPickups.isNotEmpty) ...[
                const Text(
                  'Completed',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 8),
                ...provider.completedPickups.map((pickup) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _buildPickupCard(pickup),
                )),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildPickupCard(dynamic pickup) {
    Color statusColor;
    switch (pickup.status) {
      case 'pending':
        statusColor = AppColors.warning;
        break;
      case 'accepted':
      case 'awaiting_pickup':
        statusColor = AppColors.primary;
        break;
      case 'completed':
        statusColor = AppColors.success;
        break;
      default:
        statusColor = AppColors.textMuted;
    }

    return Card(
      child: ListTile(
        title: Text(pickup.item?.title ?? 'Item'),
        subtitle: Text(pickup.statusDisplay),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: statusColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            pickup.statusDisplay,
            style: TextStyle(
              color: statusColor,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        onTap: () {
          if (pickup.item != null) {
            Navigator.pushNamed(
              context,
              AppRoutes.itemDetail,
              arguments: {'itemId': pickup.item.id},
            );
          }
        },
      ),
    );
  }
}
