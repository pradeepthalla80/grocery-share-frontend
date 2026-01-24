import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';

import '../models/item.dart';
import '../services/items_service.dart';
import 'auth_provider.dart';

class ItemsProvider with ChangeNotifier {
  final ItemsService _itemsService = ItemsService();
  
  AuthProvider? _authProvider;
  
  List<Item> _items = [];
  List<Item> _recommendations = [];
  List<Item> _trending = [];
  List<Item> _myItems = [];
  Item? _currentItem;
  
  bool _isLoading = false;
  bool _isLoadingMore = false;
  String? _error;
  
  int _currentPage = 1;
  int _totalPages = 1;
  int _total = 0;
  
  String? _searchQuery;
  String? _category;
  List<String>? _tags;
  bool? _isFree;
  bool? _storeOnly;
  int? _radius;
  String? _sortBy;
  
  List<Item> get items => _items;
  List<Item> get recommendations => _recommendations;
  List<Item> get trending => _trending;
  List<Item> get myItems => _myItems;
  Item? get currentItem => _currentItem;
  
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  String? get error => _error;
  
  int get currentPage => _currentPage;
  int get totalPages => _totalPages;
  int get total => _total;
  bool get hasMore => _currentPage < _totalPages;
  
  void updateAuth(AuthProvider auth) {
    _authProvider = auth;
  }
  
  Future<void> fetchItems({
    double? latitude,
    double? longitude,
    bool refresh = false,
  }) async {
    if (refresh) {
      _currentPage = 1;
      _items = [];
    }
    
    _isLoading = _items.isEmpty;
    _error = null;
    notifyListeners();
    
    final result = await _itemsService.getItems(
      search: _searchQuery,
      category: _category,
      tags: _tags,
      latitude: latitude,
      longitude: longitude,
      radius: _radius,
      isFree: _isFree,
      storeOnly: _storeOnly,
      sortBy: _sortBy,
      page: _currentPage,
    );
    
    _isLoading = false;
    
    if (result.success && result.items != null) {
      _items = result.items!;
      _total = result.total ?? _items.length;
      _totalPages = result.totalPages ?? 1;
    } else {
      _error = result.error;
    }
    
    notifyListeners();
  }
  
  Future<void> loadMore({double? latitude, double? longitude}) async {
    if (_isLoadingMore || !hasMore) return;
    
    _isLoadingMore = true;
    notifyListeners();
    
    _currentPage++;
    
    final result = await _itemsService.getItems(
      search: _searchQuery,
      category: _category,
      tags: _tags,
      latitude: latitude,
      longitude: longitude,
      radius: _radius,
      isFree: _isFree,
      storeOnly: _storeOnly,
      sortBy: _sortBy,
      page: _currentPage,
    );
    
    _isLoadingMore = false;
    
    if (result.success && result.items != null) {
      _items.addAll(result.items!);
    }
    
    notifyListeners();
  }
  
  Future<void> fetchRecommendations({double? latitude, double? longitude}) async {
    final result = await _itemsService.getRecommendations(
      latitude: latitude,
      longitude: longitude,
    );
    
    if (result.success && result.items != null) {
      _recommendations = result.items!;
      notifyListeners();
    }
  }
  
  Future<void> fetchTrending() async {
    final result = await _itemsService.getTrendingItems();
    
    if (result.success && result.items != null) {
      _trending = result.items!;
      notifyListeners();
    }
  }
  
  Future<void> fetchMyItems() async {
    _isLoading = true;
    notifyListeners();
    
    final result = await _itemsService.getMyItems();
    
    _isLoading = false;
    
    if (result.success && result.items != null) {
      _myItems = result.items!;
    }
    
    notifyListeners();
  }
  
  Future<bool> fetchItem(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    final result = await _itemsService.getItem(id);
    
    _isLoading = false;
    
    if (result.success && result.item != null) {
      _currentItem = result.item;
      notifyListeners();
      return true;
    }
    
    _error = result.error;
    notifyListeners();
    return false;
  }
  
  Future<Item?> createItem({
    required String title,
    required String description,
    required List<String> imagePaths,
    required String category,
    List<String>? tags,
    required int quantity,
    String? unit,
    required DateTime expiryDate,
    required bool isFree,
    double? price,
    String? address,
    double? latitude,
    double? longitude,
    String? zipCode,
    String? pickupTimeStart,
    String? pickupTimeEnd,
    List<String>? pickupDays,
    bool? isStoreItem,
    int? stockQuantity,
    bool? offersDelivery,
    double? deliveryFee,
    DateTime? validUntil,
  }) async {
    developer.log('[ItemsProvider] ========== CREATE ITEM ==========');
    developer.log('[ItemsProvider] Title: $title');
    developer.log('[ItemsProvider] Description length: ${description.length}');
    developer.log('[ItemsProvider] Category: $category');
    developer.log('[ItemsProvider] Image paths: $imagePaths');
    developer.log('[ItemsProvider] Tags: $tags');
    developer.log('[ItemsProvider] Quantity: $quantity, Unit: $unit');
    developer.log('[ItemsProvider] Expiry: $expiryDate');
    developer.log('[ItemsProvider] isFree: $isFree, Price: $price');
    developer.log('[ItemsProvider] Address: $address');
    developer.log('[ItemsProvider] Location: lat=$latitude, lng=$longitude');
    developer.log('[ItemsProvider] ZipCode: $zipCode');
    developer.log('[ItemsProvider] Pickup: $pickupTimeStart - $pickupTimeEnd on $pickupDays');
    developer.log('[ItemsProvider] Store item: $isStoreItem, Stock: $stockQuantity');
    developer.log('[ItemsProvider] Delivery: $offersDelivery, Fee: $deliveryFee');
    developer.log('[ItemsProvider] Valid until: $validUntil');
    
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    final result = await _itemsService.createItem(
      title: title,
      description: description,
      imagePaths: imagePaths,
      category: category,
      tags: tags,
      quantity: quantity,
      unit: unit,
      expiryDate: expiryDate,
      isFree: isFree,
      price: price,
      address: address,
      latitude: latitude,
      longitude: longitude,
      zipCode: zipCode,
      pickupTimeStart: pickupTimeStart,
      pickupTimeEnd: pickupTimeEnd,
      pickupDays: pickupDays,
      isStoreItem: isStoreItem,
      stockQuantity: stockQuantity,
      offersDelivery: offersDelivery,
      deliveryFee: deliveryFee,
      validUntil: validUntil,
    );
    
    _isLoading = false;
    
    developer.log('[ItemsProvider] Create result - success: ${result.success}');
    developer.log('[ItemsProvider] Create result - error: ${result.error}');
    developer.log('[ItemsProvider] Create result - item: ${result.item?.id}');
    
    if (result.success && result.item != null) {
      _myItems.insert(0, result.item!);
      developer.log('[ItemsProvider] Item added to myItems list');
      notifyListeners();
      return result.item;
    }
    
    _error = result.error ?? 'Failed to create item. Please try again.';
    developer.log('[ItemsProvider] Setting error: $_error');
    notifyListeners();
    return null;
  }
  
  Future<bool> updateItem(String id, Map<String, dynamic> updates, {List<dynamic>? newImages}) async {
    developer.log('[ItemsProvider] Updating item $id');
    developer.log('[ItemsProvider] Updates: $updates');
    developer.log('[ItemsProvider] New images: ${newImages?.length ?? 0}');
    
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    List<String>? imagePaths;
    if (newImages != null && newImages.isNotEmpty) {
      imagePaths = newImages.map((i) {
        if (i is String) return i;
        if (i.path != null) return i.path as String;
        return i.toString();
      }).toList();
    }
    
    final result = await _itemsService.updateItem(id, updates, newImagePaths: imagePaths);
    
    _isLoading = false;
    
    if (result.success && result.item != null) {
      final index = _myItems.indexWhere((i) => i.id == id);
      if (index != -1) {
        _myItems[index] = result.item!;
      }
      if (_currentItem?.id == id) {
        _currentItem = result.item;
      }
      notifyListeners();
      return true;
    }
    
    _error = result.error;
    notifyListeners();
    return false;
  }
  
  Future<bool> deleteItem(String id) async {
    final success = await _itemsService.deleteItem(id);
    
    if (success) {
      _myItems.removeWhere((i) => i.id == id);
      _items.removeWhere((i) => i.id == id);
      if (_currentItem?.id == id) {
        _currentItem = null;
      }
      notifyListeners();
    }
    
    return success;
  }
  
  Future<bool> checkDuplicate(String title) async {
    return await _itemsService.checkDuplicate(title);
  }
  
  void setFilters({
    String? search,
    String? category,
    List<String>? tags,
    bool? isFree,
    bool? storeOnly,
    int? radius,
    String? sortBy,
  }) {
    _searchQuery = search;
    _category = category;
    _tags = tags;
    _isFree = isFree;
    _storeOnly = storeOnly;
    _radius = radius;
    _sortBy = sortBy;
    _currentPage = 1;
  }
  
  void clearFilters() {
    _searchQuery = null;
    _category = null;
    _tags = null;
    _isFree = null;
    _storeOnly = null;
    _radius = null;
    _sortBy = null;
    _currentPage = 1;
  }
  
  void clearCurrentItem() {
    _currentItem = null;
    notifyListeners();
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
