import 'dart:developer' as developer;
import 'package:dio/dio.dart';

import '../models/item.dart';
import 'api_client.dart';

class ItemsService {
  final ApiClient _api = ApiClient();
  
  Future<ItemsResult> getItems({
    String? search,
    String? category,
    List<String>? tags,
    double? latitude,
    double? longitude,
    int? radius,
    bool? isFree,
    bool? storeOnly,
    String? sortBy,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      
      if (search != null && search.isNotEmpty) queryParams['keyword'] = search;
      if (category != null) queryParams['category'] = category;
      if (tags != null && tags.isNotEmpty) queryParams['tags'] = tags.join(',');
      if (latitude != null) queryParams['lat'] = latitude;
      if (longitude != null) queryParams['lng'] = longitude;
      if (radius != null) queryParams['radius'] = radius;
      if (isFree != null) queryParams['isFree'] = isFree;
      if (storeOnly != null) queryParams['onlyStoreItems'] = storeOnly;
      if (sortBy != null) queryParams['sortBy'] = sortBy;
      
      final response = await _api.get('/items', queryParameters: queryParams);
      final data = response.data;
      
      // Handle null or missing items array gracefully
      final itemsList = data['items'] as List<dynamic>? ?? [];
      final items = itemsList
          .map((item) => Item.fromJson(item))
          .toList();
      
      return ItemsResult(
        success: true,
        items: items,
        total: data['total'] ?? items.length,
        page: data['page'] ?? page,
        totalPages: data['totalPages'] ?? 1,
      );
    } catch (e) {
      return ItemsResult(success: false, error: _parseError(e));
    }
  }
  
  Future<ItemResult> getItem(String id) async {
    try {
      final response = await _api.get('/items/$id');
      final item = Item.fromJson(response.data['item'] ?? response.data);
      return ItemResult(success: true, item: item);
    } catch (e) {
      return ItemResult(success: false, error: _parseError(e));
    }
  }
  
  Future<ItemsResult> getRecommendations({
    double? latitude,
    double? longitude,
    int limit = 10,
  }) async {
    try {
      final queryParams = <String, dynamic>{'limit': limit};
      if (latitude != null) queryParams['lat'] = latitude;
      if (longitude != null) queryParams['lng'] = longitude;
      
      final response = await _api.get('/items/recommendations', queryParameters: queryParams);
      final itemsList = response.data['items'] as List<dynamic>? ?? [];
      final items = itemsList
          .map((item) => Item.fromJson(item))
          .toList();
      
      return ItemsResult(success: true, items: items);
    } catch (e) {
      // Recommendations are non-critical, return empty list on failure
      return ItemsResult(success: true, items: []);
    }
  }
  
  Future<ItemsResult> getTrendingItems({int limit = 10}) async {
    try {
      final response = await _api.get('/items/trending', queryParameters: {'limit': limit});
      final itemsList = response.data['items'] as List<dynamic>? ?? [];
      final items = itemsList
          .map((item) => Item.fromJson(item))
          .toList();
      
      return ItemsResult(success: true, items: items);
    } catch (e) {
      return ItemsResult(success: false, error: _parseError(e));
    }
  }
  
  Future<ItemsResult> getMyItems() async {
    try {
      final response = await _api.get('/items/my-items');
      final itemsList = response.data['items'] as List<dynamic>? ?? [];
      final items = itemsList
          .map((item) => Item.fromJson(item))
          .toList();
      
      return ItemsResult(success: true, items: items);
    } catch (e) {
      return ItemsResult(success: false, error: _parseError(e));
    }
  }
  
  Future<ItemResult> createItem({
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
    try {
      final formData = FormData();
      
      formData.fields.addAll([
        MapEntry('title', title),
        MapEntry('description', description),
        MapEntry('category', category),
        MapEntry('quantity', quantity.toString()),
        MapEntry('expiryDate', expiryDate.toIso8601String()),
        MapEntry('isFree', isFree.toString()),
      ]);
      
      if (tags != null) formData.fields.add(MapEntry('tags', tags.join(',')));
      if (unit != null) formData.fields.add(MapEntry('unit', unit));
      if (price != null) formData.fields.add(MapEntry('price', price.toString()));
      if (address != null) formData.fields.add(MapEntry('address', address));
      if (latitude != null) formData.fields.add(MapEntry('latitude', latitude.toString()));
      if (longitude != null) formData.fields.add(MapEntry('longitude', longitude.toString()));
      if (zipCode != null) formData.fields.add(MapEntry('zipCode', zipCode));
      if (pickupTimeStart != null) formData.fields.add(MapEntry('pickupTimeStart', pickupTimeStart));
      if (pickupTimeEnd != null) formData.fields.add(MapEntry('pickupTimeEnd', pickupTimeEnd));
      if (pickupDays != null) formData.fields.add(MapEntry('pickupDays', pickupDays.join(',')));
      if (isStoreItem != null) formData.fields.add(MapEntry('isStoreItem', isStoreItem.toString()));
      if (stockQuantity != null) formData.fields.add(MapEntry('stockQuantity', stockQuantity.toString()));
      if (offersDelivery != null) formData.fields.add(MapEntry('offersDelivery', offersDelivery.toString()));
      if (deliveryFee != null) formData.fields.add(MapEntry('deliveryFee', deliveryFee.toString()));
      if (validUntil != null) formData.fields.add(MapEntry('validUntil', validUntil.toIso8601String()));
      
      for (int i = 0; i < imagePaths.length; i++) {
        formData.files.add(MapEntry(
          'images',
          await MultipartFile.fromFile(imagePaths[i]),
        ));
      }
      
      developer.log('[ItemsService] Creating item with payload:');
      developer.log('[ItemsService] - title: $title');
      developer.log('[ItemsService] - category: $category');
      developer.log('[ItemsService] - address: $address');
      developer.log('[ItemsService] - latitude: $latitude, longitude: $longitude');
      developer.log('[ItemsService] - isFree: $isFree, price: $price');
      developer.log('[ItemsService] - images count: ${imagePaths.length}');
      developer.log('[ItemsService] - isStoreItem: $isStoreItem');
      developer.log('[ItemsService] FormData fields: ${formData.fields.map((e) => '${e.key}=${e.value}').join(', ')}');
      
      final response = await _api.uploadFile('/items', formData: formData);
      
      developer.log('[ItemsService] Create item response status: ${response.statusCode}');
      developer.log('[ItemsService] Create item response: ${response.data}');
      
      final item = Item.fromJson(response.data['item'] ?? response.data);
      
      return ItemResult(success: true, item: item);
    } catch (e, stackTrace) {
      developer.log('[ItemsService] ERROR creating item: $e');
      developer.log('[ItemsService] Stack trace: $stackTrace');
      if (e is DioException) {
        developer.log('[ItemsService] Response status: ${e.response?.statusCode}');
        developer.log('[ItemsService] Response data: ${e.response?.data}');
      }
      return ItemResult(success: false, error: _parseError(e));
    }
  }
  
  Future<ItemResult> updateItem(String id, Map<String, dynamic> updates, {List<String>? newImagePaths}) async {
    try {
      if (newImagePaths != null && newImagePaths.isNotEmpty) {
        final formData = FormData();
        
        updates.forEach((key, value) {
          if (value != null) {
            if (value is List) {
              for (var item in value) {
                formData.fields.add(MapEntry('$key[]', item.toString()));
              }
            } else {
              formData.fields.add(MapEntry(key, value.toString()));
            }
          }
        });
        
        for (int i = 0; i < newImagePaths.length; i++) {
          formData.files.add(MapEntry(
            'images',
            await MultipartFile.fromFile(newImagePaths[i]),
          ));
        }
        
        final response = await _api.uploadFile('/items/$id', formData: formData);
        final item = Item.fromJson(response.data['item'] ?? response.data);
        return ItemResult(success: true, item: item);
      } else {
        final response = await _api.put('/items/$id', data: updates);
        final item = Item.fromJson(response.data['item'] ?? response.data);
        return ItemResult(success: true, item: item);
      }
    } catch (e) {
      return ItemResult(success: false, error: _parseError(e));
    }
  }
  
  Future<bool> deleteItem(String id) async {
    try {
      await _api.delete('/items/$id');
      return true;
    } catch (_) {
      return false;
    }
  }
  
  Future<bool> checkDuplicate(String title) async {
    try {
      final response = await _api.get('/items/check-duplicate', queryParameters: {'title': title});
      return response.data['isDuplicate'] ?? false;
    } catch (_) {
      return false;
    }
  }
  
  String _parseError(dynamic e) {
    if (e is DioException && e.response?.data != null) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        return data['message'];
      }
    }
    return 'An error occurred. Please try again.';
  }
}

class ItemsResult {
  final bool success;
  final List<Item>? items;
  final int? total;
  final int? page;
  final int? totalPages;
  final String? error;
  
  ItemsResult({
    required this.success,
    this.items,
    this.total,
    this.page,
    this.totalPages,
    this.error,
  });
}

class ItemResult {
  final bool success;
  final Item? item;
  final String? error;
  
  ItemResult({
    required this.success,
    this.item,
    this.error,
  });
}
