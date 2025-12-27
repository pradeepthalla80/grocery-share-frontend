import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../models/item.dart';

class ItemCard extends StatelessWidget {
  final Item item;
  final VoidCallback? onTap;

  const ItemCard({
    super.key,
    required this.item,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        clipBehavior: Clip.antiAlias,
        margin: EdgeInsets.zero,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(
                width: 100,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    item.images.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: item.images.first,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              color: AppColors.divider,
                              child: const Center(
                                child: SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                              ),
                            ),
                            errorWidget: (context, url, error) => Container(
                              color: AppColors.divider,
                              child: const Icon(Icons.image_not_supported, size: 24),
                            ),
                          )
                        : Container(
                            color: AppColors.divider,
                            child: const Icon(
                              Icons.shopping_basket,
                              size: 32,
                              color: AppColors.textMuted,
                            ),
                          ),
                    if (item.images.length > 1)
                      Positioned(
                        bottom: 4,
                        right: 4,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.photo_library, color: Colors.white, size: 10),
                              const SizedBox(width: 2),
                              Text(
                                '${item.images.length}',
                                style: const TextStyle(color: Colors.white, fontSize: 10),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              item.title,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          _buildPriceChip(),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          if (item.isStoreItem) _buildChip('Store', AppColors.store),
                          _buildChip(item.category, AppColors.divider, textColor: AppColors.textSecondary),
                          _buildChip('Qty: ${item.quantity}', AppColors.divider, textColor: AppColors.textSecondary),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(
                            Icons.calendar_today,
                            size: 12,
                            color: item.isExpired ? AppColors.error : AppColors.textMuted,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            item.isExpired
                                ? 'Expired'
                                : DateFormat('MMM d').format(item.expiryDate),
                            style: TextStyle(
                              fontSize: 11,
                              color: item.isExpired ? AppColors.error : AppColors.textMuted,
                            ),
                          ),
                          if (item.distance != null) ...[
                            const SizedBox(width: 12),
                            const Icon(Icons.location_on, size: 12, color: AppColors.textMuted),
                            const SizedBox(width: 2),
                            Text(
                              item.distanceDisplay,
                              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                            ),
                          ],
                          if (item.offersDelivery) ...[
                            const Spacer(),
                            Icon(Icons.local_shipping, size: 12, color: AppColors.primary),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              Container(
                width: 24,
                alignment: Alignment.center,
                child: Icon(
                  Icons.chevron_right,
                  size: 20,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPriceChip() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: item.isFree ? AppColors.free : AppColors.paid,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        item.priceDisplay,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildChip(String label, Color bgColor, {Color? textColor}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor.withOpacity(textColor != null ? 1 : 0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          color: textColor ?? bgColor,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
