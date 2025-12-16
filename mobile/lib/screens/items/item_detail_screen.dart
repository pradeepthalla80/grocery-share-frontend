import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../models/item.dart';
import '../../providers/items_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/common/loading_button.dart';

class ItemDetailScreen extends StatefulWidget {
  final String itemId;

  const ItemDetailScreen({super.key, required this.itemId});

  @override
  State<ItemDetailScreen> createState() => _ItemDetailScreenState();
}

class _ItemDetailScreenState extends State<ItemDetailScreen> {
  int _currentImageIndex = 0;
  final PageController _pageController = PageController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ItemsProvider>().fetchItem(widget.itemId);
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _contactSeller(Item item) async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) {
      Navigator.pushNamed(context, AppRoutes.login);
      return;
    }

    if (item.ownerId == auth.user?.id) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('This is your own listing')),
      );
      return;
    }

    final chatProvider = context.read<ChatProvider>();
    final conversation = await chatProvider.getOrCreateConversation(
      recipientId: item.ownerId,
      itemId: item.id,
    );

    if (!mounted) return;

    if (conversation != null) {
      Navigator.pushNamed(
        context,
        AppRoutes.chat,
        arguments: {
          'conversationId': conversation.id,
          'recipientId': item.ownerId,
          'recipientName': item.owner?.name ?? 'Seller',
          'itemId': item.id,
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<ItemsProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.currentItem == null) {
            return const Center(child: CircularProgressIndicator());
          }

          final item = provider.currentItem;
          if (item == null) {
            return const Center(child: Text('Item not found'));
          }

          final auth = context.read<AuthProvider>();
          final isOwner = item.ownerId == auth.user?.id;

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 300,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  background: item.images.isNotEmpty
                      ? Stack(
                          children: [
                            PageView.builder(
                              controller: _pageController,
                              itemCount: item.images.length,
                              onPageChanged: (index) {
                                setState(() => _currentImageIndex = index);
                              },
                              itemBuilder: (context, index) {
                                return CachedNetworkImage(
                                  imageUrl: item.images[index],
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => Container(
                                    color: AppColors.divider,
                                    child: const Center(
                                      child: CircularProgressIndicator(),
                                    ),
                                  ),
                                  errorWidget: (context, url, error) =>
                                      Container(
                                    color: AppColors.divider,
                                    child: const Icon(Icons.image_not_supported),
                                  ),
                                );
                              },
                            ),
                            if (item.images.length > 1)
                              Positioned(
                                bottom: 16,
                                left: 0,
                                right: 0,
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: List.generate(
                                    item.images.length,
                                    (index) => Container(
                                      width: 8,
                                      height: 8,
                                      margin: const EdgeInsets.symmetric(horizontal: 4),
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: index == _currentImageIndex
                                            ? Colors.white
                                            : Colors.white.withOpacity(0.5),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        )
                      : Container(
                          color: AppColors.divider,
                          child: const Icon(
                            Icons.image_not_supported,
                            size: 64,
                            color: AppColors.textMuted,
                          ),
                        ),
                ),
                actions: [
                  if (isOwner)
                    PopupMenuButton<String>(
                      onSelected: (value) async {
                        if (value == 'edit') {
                          Navigator.pushNamed(
                            context,
                            AppRoutes.editItem,
                            arguments: {'itemId': item.id},
                          );
                        } else if (value == 'delete') {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: const Text('Delete Item'),
                              content: const Text(
                                  'Are you sure you want to delete this item?'),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context, false),
                                  child: const Text('Cancel'),
                                ),
                                TextButton(
                                  onPressed: () => Navigator.pop(context, true),
                                  style: TextButton.styleFrom(
                                    foregroundColor: AppColors.error,
                                  ),
                                  child: const Text('Delete'),
                                ),
                              ],
                            ),
                          );
                          if (confirm == true && mounted) {
                            await provider.deleteItem(item.id);
                            Navigator.pop(context);
                          }
                        }
                      },
                      itemBuilder: (context) => [
                        const PopupMenuItem(value: 'edit', child: Text('Edit')),
                        const PopupMenuItem(
                          value: 'delete',
                          child: Text('Delete', style: TextStyle(color: AppColors.error)),
                        ),
                      ],
                    ),
                ],
              ),

              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (item.isStoreItem)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.store.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'Store',
                                style: TextStyle(
                                  color: AppColors.store,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          if (item.isStoreItem) const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: item.isFree
                                  ? AppColors.free.withOpacity(0.1)
                                  : AppColors.paid.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              item.priceDisplay,
                              style: TextStyle(
                                color: item.isFree ? AppColors.free : AppColors.paid,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const Spacer(),
                          if (item.distance != null)
                            Row(
                              children: [
                                const Icon(
                                  Icons.location_on,
                                  size: 16,
                                  color: AppColors.textMuted,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  item.distanceDisplay,
                                  style: const TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      Text(
                        item.title,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),

                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.divider,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              item.category,
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Qty: ${item.quantity} ${item.unit}',
                            style: const TextStyle(color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      const Text(
                        'Description',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        item.description,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 16),

                      if (item.tags.isNotEmpty) ...[
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: item.tags.map((tag) {
                            return Chip(
                              label: Text(tag, style: const TextStyle(fontSize: 12)),
                              padding: EdgeInsets.zero,
                              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 16),
                      ],

                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildInfoRow(
                                Icons.calendar_today,
                                'Expires',
                                DateFormat('MMM d, yyyy').format(item.expiryDate),
                              ),
                              if (item.offersDelivery) ...[
                                const SizedBox(height: 12),
                                _buildInfoRow(
                                  Icons.local_shipping,
                                  'Delivery Available',
                                  item.deliveryFee != null
                                      ? '\$${item.deliveryFee!.toStringAsFixed(2)}'
                                      : 'Free',
                                ),
                              ],
                              if (item.pickupTimeStart != null) ...[
                                const SizedBox(height: 12),
                                _buildInfoRow(
                                  Icons.access_time,
                                  'Pickup Time',
                                  '${item.pickupTimeStart} - ${item.pickupTimeEnd}',
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      if (item.owner != null)
                        Card(
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundImage: item.owner!.profileImage != null
                                  ? CachedNetworkImageProvider(item.owner!.profileImage!)
                                  : null,
                              child: item.owner!.profileImage == null
                                  ? Text(item.owner!.name[0].toUpperCase())
                                  : null,
                            ),
                            title: Text(item.owner!.name),
                            subtitle: Row(
                              children: [
                                const Icon(Icons.star, size: 16, color: AppColors.accent),
                                const SizedBox(width: 4),
                                Text(
                                  '${item.owner!.rating.toStringAsFixed(1)} (${item.owner!.totalRatings})',
                                ),
                              ],
                            ),
                            trailing: item.owner!.isStoreOwner
                                ? Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.store.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text(
                                      'Store Owner',
                                      style: TextStyle(
                                        color: AppColors.store,
                                        fontSize: 12,
                                      ),
                                    ),
                                  )
                                : null,
                          ),
                        ),
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
      bottomSheet: Consumer<ItemsProvider>(
        builder: (context, provider, _) {
          final item = provider.currentItem;
          if (item == null) return const SizedBox.shrink();

          final auth = context.read<AuthProvider>();
          final isOwner = item.ownerId == auth.user?.id;

          if (isOwner) return const SizedBox.shrink();

          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.priceDisplay,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                        if (item.distance != null)
                          Text(
                            item.distanceDisplay,
                            style: const TextStyle(color: AppColors.textMuted),
                          ),
                      ],
                    ),
                  ),
                  LoadingButton(
                    onPressed: () => _contactSeller(item),
                    isLoading: context.watch<ChatProvider>().isLoading,
                    label: item.isFree ? 'Request Item' : 'Buy Now',
                    width: 150,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.textMuted),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 12,
              ),
            ),
            Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ],
    );
  }
}
