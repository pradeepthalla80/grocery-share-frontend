import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../config/app_config.dart';
import '../../providers/items_provider.dart';
import '../../providers/location_provider.dart';
import '../../providers/auth_provider.dart';
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
  bool _hasInitializedItems = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _applyFilters() {
    final itemsProvider = context.read<ItemsProvider>();
    final locationProvider = context.read<LocationProvider>();

    if (locationProvider.latitude == null || locationProvider.longitude == null) return;

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

    if (locationProvider.latitude == null || locationProvider.longitude == null) return;

    itemsProvider.clearFilters();
    itemsProvider.fetchItems(
      latitude: locationProvider.latitude,
      longitude: locationProvider.longitude,
      refresh: true,
    );
  }

  Future<void> _requestLocationPermission() async {
    if (!mounted) return;
    
    final locationProvider = context.read<LocationProvider>();
    
    locationProvider.clearError();
    
    final success = await locationProvider.getCurrentLocation();
    
    if (success && mounted) {
      _fetchItemsWithLocation();
    }
  }
  
  Future<void> _retryLocationFetch() async {
    if (!mounted) return;
    
    final locationProvider = context.read<LocationProvider>();
    locationProvider.clearError();
    
    final success = await locationProvider.initializeLocation();
    
    if (success && mounted) {
      _fetchItemsWithLocation();
    }
  }
  
  Future<void> _upgradeToGPS() async {
    if (!mounted) return;
    
    final locationProvider = context.read<LocationProvider>();
    locationProvider.clearError();
    
    final success = await locationProvider.upgradeToGPS();
    
    if (success && mounted) {
      _hasInitializedItems = false;
      _fetchItemsWithLocation();
    }
  }

  void _fetchItemsWithLocation() {
    final locationProvider = context.read<LocationProvider>();
    final itemsProvider = context.read<ItemsProvider>();

    if (locationProvider.latitude != null && locationProvider.longitude != null) {
      _hasInitializedItems = true;
      itemsProvider.fetchItems(
        latitude: locationProvider.latitude,
        longitude: locationProvider.longitude,
        refresh: true,
      );
      itemsProvider.fetchRecommendations(
        latitude: locationProvider.latitude,
        longitude: locationProvider.longitude,
      );
    }
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

  Widget _buildLocationLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(
            'Fetching your location...',
            style: TextStyle(
              fontSize: 16,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'This helps us show items near you',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationErrorState(String? error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.location_searching,
              size: 64,
              color: AppColors.textMuted,
            ),
            const SizedBox(height: 16),
            const Text(
              'Finding Your Location',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              error ?? 'We need your location to show nearby items.',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _retryLocationFetch,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<LocationProvider, ItemsProvider>(
        builder: (context, locationProvider, itemsProvider, _) {
          if (locationProvider.isLoading) {
            return _buildLocationLoadingState();
          }

          if (!locationProvider.hasLocation) {
            return _buildLocationErrorState(locationProvider.error);
          }

          if (!_hasInitializedItems) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _fetchItemsWithLocation();
            });
          }

          final auth = context.read<AuthProvider>();
          final showStoreBanner = auth.isAuthenticated && !auth.isStoreOwner;
          
          return Column(
            children: [
              if (showStoreBanner)
                _buildStoreOwnerBanner(context),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
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

              if (locationProvider.currentAddress != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    children: [
                      Icon(
                        locationProvider.isIPLocation ? Icons.public : Icons.location_on,
                        size: 16,
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          locationProvider.currentAddress!,
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (locationProvider.isIPLocation)
                        TextButton(
                          onPressed: _upgradeToGPS,
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text(
                            'Use GPS',
                            style: TextStyle(fontSize: 12, color: AppColors.primary),
                          ),
                        )
                      else
                        TextButton(
                          onPressed: _requestLocationPermission,
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text(
                            'Update',
                            style: TextStyle(fontSize: 12, color: AppColors.primary),
                          ),
                        ),
                    ],
                  ),
                ),

              Expanded(
                child: _buildItemsList(itemsProvider, locationProvider),
              ),
            ],
          );
        },
    );
  }

  Widget _buildItemsList(ItemsProvider provider, LocationProvider locationProvider) {
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
        await provider.fetchItems(
          latitude: locationProvider.latitude,
          longitude: locationProvider.longitude,
          refresh: true,
        );
      },
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
        itemCount: provider.items.length + (provider.hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == provider.items.length) {
            if (!provider.isLoadingMore) {
              provider.loadMore(
                latitude: locationProvider.latitude,
                longitude: locationProvider.longitude,
              );
            }
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(12),
                child: CircularProgressIndicator(),
              ),
            );
          }

          final item = provider.items[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
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
  }
  
  Widget _buildStoreOwnerBanner(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.store, AppColors.store.withOpacity(0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.store,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Want to Become a Store Owner?',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Sell your products to the community',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pushNamed(context, AppRoutes.storeOnboarding),
            style: TextButton.styleFrom(
              backgroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            child: Text(
              'Learn More',
              style: TextStyle(
                color: AppColors.store,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
