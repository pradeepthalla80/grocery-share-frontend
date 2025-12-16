import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../config/app_config.dart';
import '../../providers/items_provider.dart';
import '../../providers/location_provider.dart';
import '../../widgets/items/item_card.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/common/search_bar.dart' as custom;

class ItemsScreen extends StatefulWidget {
  const ItemsScreen({super.key});

  @override
  State<ItemsScreen> createState() => _ItemsScreenState();
}

class _ItemsScreenState extends State<ItemsScreen> {
  final _searchController = TextEditingController();
  String? _selectedCategory;
  bool? _showFreeOnly;
  bool? _showStoreOnly;
  int _selectedRadius = AppConfig.defaultSearchRadius;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _applyFilters() {
    final itemsProvider = context.read<ItemsProvider>();
    final locationProvider = context.read<LocationProvider>();

    itemsProvider.setFilters(
      search: _searchController.text.trim().isNotEmpty
          ? _searchController.text.trim()
          : null,
      category: _selectedCategory,
      isFree: _showFreeOnly,
      storeOnly: _showStoreOnly,
      radius: _selectedRadius,
    );

    itemsProvider.fetchItems(
      latitude: locationProvider.latitude,
      longitude: locationProvider.longitude,
      refresh: true,
    );
  }

  void _clearFilters() {
    setState(() {
      _searchController.clear();
      _selectedCategory = null;
      _showFreeOnly = null;
      _showStoreOnly = null;
      _selectedRadius = AppConfig.defaultSearchRadius;
    });

    final itemsProvider = context.read<ItemsProvider>();
    final locationProvider = context.read<LocationProvider>();

    itemsProvider.clearFilters();
    itemsProvider.fetchItems(
      latitude: locationProvider.latitude,
      longitude: locationProvider.longitude,
      refresh: true,
    );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) {
          return DraggableScrollableSheet(
            initialChildSize: 0.6,
            minChildSize: 0.4,
            maxChildSize: 0.9,
            expand: false,
            builder: (context, scrollController) {
              return Padding(
                padding: const EdgeInsets.all(20),
                child: ListView(
                  controller: scrollController,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Filters',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            setSheetState(() {
                              _selectedCategory = null;
                              _showFreeOnly = null;
                              _showStoreOnly = null;
                              _selectedRadius = AppConfig.defaultSearchRadius;
                            });
                          },
                          child: const Text('Reset'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    const Text(
                      'Category',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: AppConfig.itemCategories.map((category) {
                        final isSelected = _selectedCategory == category;
                        return ChoiceChip(
                          label: Text(category),
                          selected: isSelected,
                          onSelected: (selected) {
                            setSheetState(() {
                              _selectedCategory = selected ? category : null;
                            });
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),

                    const Text(
                      'Price',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        ChoiceChip(
                          label: const Text('All'),
                          selected: _showFreeOnly == null,
                          onSelected: (selected) {
                            setSheetState(() => _showFreeOnly = null);
                          },
                        ),
                        const SizedBox(width: 8),
                        ChoiceChip(
                          label: const Text('Free Only'),
                          selected: _showFreeOnly == true,
                          onSelected: (selected) {
                            setSheetState(() => _showFreeOnly = selected ? true : null);
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Store Items Only',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                        Switch(
                          value: _showStoreOnly ?? false,
                          onChanged: (value) {
                            setSheetState(() => _showStoreOnly = value ? true : null);
                          },
                          activeColor: AppColors.primary,
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    Text(
                      'Distance: $_selectedRadius miles',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    Slider(
                      value: _selectedRadius.toDouble(),
                      min: 1,
                      max: AppConfig.maxSearchRadius.toDouble(),
                      divisions: AppConfig.maxSearchRadius - 1,
                      label: '$_selectedRadius mi',
                      onChanged: (value) {
                        setSheetState(() => _selectedRadius = value.round());
                      },
                      activeColor: AppColors.primary,
                    ),
                    const SizedBox(height: 24),

                    ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _applyFilters();
                      },
                      child: const Text('Apply Filters'),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('BaskMate'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => Navigator.pushNamed(context, AppRoutes.notifications),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: custom.CustomSearchBar(
                    controller: _searchController,
                    hintText: 'Search items...',
                    onSubmitted: (_) => _applyFilters(),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.tune),
                    onPressed: _showFilterSheet,
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: Consumer<ItemsProvider>(
              builder: (context, provider, _) {
                if (provider.isLoading && provider.items.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (provider.error != null && provider.items.isEmpty) {
                  return EmptyState(
                    icon: Icons.error_outline,
                    title: 'Something went wrong',
                    message: provider.error!,
                    actionLabel: 'Try Again',
                    onAction: () {
                      final locationProvider = context.read<LocationProvider>();
                      provider.fetchItems(
                        latitude: locationProvider.latitude,
                        longitude: locationProvider.longitude,
                        refresh: true,
                      );
                    },
                  );
                }

                if (provider.items.isEmpty) {
                  return EmptyState(
                    icon: Icons.shopping_basket_outlined,
                    title: 'No items found',
                    message: 'Be the first to share groceries in your area!',
                    actionLabel: 'Add Item',
                    onAction: () => Navigator.pushNamed(context, AppRoutes.addItem),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    final locationProvider = context.read<LocationProvider>();
                    await provider.fetchItems(
                      latitude: locationProvider.latitude,
                      longitude: locationProvider.longitude,
                      refresh: true,
                    );
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: provider.items.length + (provider.hasMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == provider.items.length) {
                        if (!provider.isLoadingMore) {
                          final locationProvider = context.read<LocationProvider>();
                          provider.loadMore(
                            latitude: locationProvider.latitude,
                            longitude: locationProvider.longitude,
                          );
                        }
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: CircularProgressIndicator(),
                          ),
                        );
                      }

                      final item = provider.items[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: ItemCard(
                          item: item,
                          onTap: () {
                            Navigator.pushNamed(
                              context,
                              AppRoutes.itemDetail,
                              arguments: {'itemId': item.id},
                            );
                          },
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
