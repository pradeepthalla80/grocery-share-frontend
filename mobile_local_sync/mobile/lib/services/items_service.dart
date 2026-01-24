import 'dart:developer' as developer;
import 'dart:io';
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
      developer.log('[ItemsService] ========== CREATE ITEM START ==========');
      developer.log('[ItemsService] Title: $title');
      developer.log('[ItemsService] Category: $category');
      developer.log('[ItemsService] Address: $address');
      developer.log('[ItemsService] Lat/Lng: $latitude, $longitude');
      developer.log('[ItemsService] isFree: $isFree, price: $price');
      developer.log('[ItemsService] Image paths received: $imagePaths');
      developer.log('[ItemsService] Image count: ${imagePaths.length}');
      
      if (imagePaths.isEmpty) {
        developer.log('[ItemsService] ERROR: No images provided');
        return ItemResult(success: false, error: 'At least one image is required');
      }
      
      final validImagePaths = <String>[];
      for (int i = 0; i < imagePaths.length; i++) {
        String path = imagePaths[i];
        
        if (path.startsWith('file://')) {
          path = path.replaceFirst('file://', '');
          developer.log('[ItemsService] Stripped file:// prefix from path $i: $path');
        }
        
        final file = File(path);
        final exists = await file.exists();
        developer.log('[ItemsService] Image $i path: $path');
        developer.log('[ItemsService] Image $i exists: $exists');
        
        if (exists) {
          final fileSize = await file.length();
          developer.log('[ItemsService] Image $i size: $fileSize bytes');
          
          if (fileSize > 0) {
            validImagePaths.add(path);
          } else {
            developer.log('[ItemsService] WARNING: Image $i is empty (0 bytes)');
          }
        } else {
          developer.log('[ItemsService] WARNING: Image $i does not exist at path: $path');
        }
      }
      
      if (validImagePaths.isEmpty) {
        developer.log('[ItemsService] ERROR: No valid images found');
        return ItemResult(success: false, error: 'Could not access selected images. Please try selecting them again.');
      }
      
      developer.log('[ItemsService] Valid images to upload: ${validImagePaths.length}');
      
      final formData = FormData();
      
      formData.fields.addAll([
        MapEntry('name', title),
        MapEntry('description', description),
        MapEntry('category', category),
        MapEntry('quantity', quantity.toString()),
        MapEntry('expiryDate', expiryDate.toIso8601String()),
        MapEntry('isFree', isFree.toString()),
      ]);
      
      if (tags != null && tags.isNotEmpty) {
        formData.fields.add(MapEntry('tags', tags.join(',')));
      }
      if (unit != null && unit.isNotEmpty) {
        formData.fields.add(MapEntry('unit', unit));
      }
      if (!isFree && price != null) {
        formData.fields.add(MapEntry('price', price.toString()));
      }
      if (address != null && address.isNotEmpty) {
        formData.fields.add(MapEntry('address', address));
      }
      if (latitude != null && longitude != null) {
        formData.fields.add(MapEntry('location', '{"lat": $latitude, "lng": $longitude}'));
      }
      if (zipCode != null && zipCode.isNotEmpty) {
        formData.fields.add(MapEntry('zipCode', zipCode));
      }
      if (pickupTimeStart != null && pickupTimeStart.isNotEmpty) {
        formData.fields.add(MapEntry('pickupTimeStart', pickupTimeStart));
      }
      if (pickupTimeEnd != null && pickupTimeEnd.isNotEmpty) {
        formData.fields.add(MapEntry('pickupTimeEnd', pickupTimeEnd));
      }
      if (pickupDays != null && pickupDays.isNotEmpty) {
        formData.fields.add(MapEntry('pickupDays', pickupDays.join(',')));
      }
      if (isStoreItem != null) {
        formData.fields.add(MapEntry('isStoreItem', isStoreItem.toString()));
      }
      if (stockQuantity != null) {
        formData.fields.add(MapEntry('stockQuantity', stockQuantity.toString()));
      }
      if (offersDelivery != null) {
        formData.fields.add(MapEntry('offersDelivery', offersDelivery.toString()));
      }
      if (deliveryFee != null) {
        formData.fields.add(MapEntry('deliveryFee', deliveryFee.toString()));
      }
      if (validUntil != null) {
        formData.fields.add(MapEntry('validUntil', validUntil.toIso8601String()));
      }
      
      developer.log('[ItemsService] FormData fields:');
      for (final field in formData.fields) {
        developer.log('[ItemsService]   ${field.key}: ${field.value}');
      }
      
      for (int i = 0; i < validImagePaths.length; i++) {
        try {
          final filePath = validImagePaths[i];
          final fileName = filePath.split('/').last;
          
          String contentType = 'image/jpeg';
          final lowerFileName = fileName.toLowerCase();
          if (lowerFileName.endsWith('.png')) {
            contentType = 'image/png';
          } else if (lowerFileName.endsWith('.gif')) {
            contentType = 'image/gif';
          } else if (lowerFileName.endsWith('.webp')) {
            contentType = 'image/webp';
          } else if (lowerFileName.endsWith('.heic') || lowerFileName.endsWith('.heif')) {
            contentType = 'image/heic';
          }
          
          developer.log('[ItemsService] Adding image $i: $fileName (type: $contentType)');
          
          final multipartFile = await MultipartFile.fromFile(
            filePath,
            filename: fileName,
            contentType: DioMediaType.parse(contentType),
          );
          
          formData.files.add(MapEntry('images', multipartFile));
          developer.log('[ItemsService] Image $i added successfully');
        } catch (e, stack) {
          developer.log('[ItemsService] ERROR adding image $i: $e');
          developer.log('[ItemsService] Stack: $stack');
          return ItemResult(success: false, error: 'Failed to process image ${i + 1}. Please try again.');
        }
      }
      
      developer.log('[ItemsService] Total files in FormData: ${formData.files.length}');
      developer.log('[ItemsService] Sending request to /items...');
      
      final response = await _api.uploadFile('/items', formData: formData);
      
      developer.log('[ItemsService] Response status: ${response.statusCode}');
      developer.log('[ItemsService] Response data type: ${response.data.runtimeType}');
      developer.log('[ItemsService] Response data: ${response.data}');
      
      dynamic itemData;
      if (response.data is Map) {
        itemData = response.data['item'] ?? response.data;
      } else {
        developer.log('[ItemsService] ERROR: Unexpected response format');
        return ItemResult(success: false, error: 'Unexpected server response format');
      }
      
      final item = Item.fromJson(itemData);
      developer.log('[ItemsService] Item created successfully with ID: ${item.id}');
      developer.log('[ItemsService] ========== CREATE ITEM END ==========');
      
      return ItemResult(success: true, item: item);
    } on DioException catch (e, stackTrace) {
      developer.log('[ItemsService] ========== DIO ERROR ==========');
      developer.log('[ItemsService] Error type: ${e.type}');
      developer.log('[ItemsService] Error message: ${e.message}');
      developer.log('[ItemsService] Response status: ${e.response?.statusCode}');
      developer.log('[ItemsService] Response headers: ${e.response?.headers}');
      developer.log('[ItemsService] Response data: ${e.response?.data}');
      developer.log('[ItemsService] Request path: ${e.requestOptions.path}');
      developer.log('[ItemsService] Stack trace: $stackTrace');
      
      return ItemResult(success: false, error: _parseError(e));
    } on FileSystemException catch (e, stackTrace) {
      developer.log('[ItemsService] ========== FILE SYSTEM ERROR ==========');
      developer.log('[ItemsService] Error: $e');
      developer.log('[ItemsService] Path: ${e.path}');
      developer.log('[ItemsService] Stack trace: $stackTrace');
      
      return ItemResult(success: false, error: 'Could not access image file. Please try selecting the image again.');
    } catch (e, stackTrace) {
      developer.log('[ItemsService] ========== UNEXPECTED ERROR ==========');
      developer.log('[ItemsService] Error type: ${e.runtimeType}');
      developer.log('[ItemsService] Error: $e');
      developer.log('[ItemsService] Stack trace: $stackTrace');
      
      return ItemResult(success: false, error: _parseError(e));
    }
  }
  
  Future<ItemResult> updateItem(String id, Map<String, dynamic> updates, {List<String>? newImagePaths}) async {
    try {
      developer.log('[ItemsService] Updating item $id');
      developer.log('[ItemsService] Updates: $updates');
      developer.log('[ItemsService] New image paths: $newImagePaths');
      
      if (newImagePaths != null && newImagePaths.isNotEmpty) {
        final formData = FormData();
        
        updates.forEach((key, value) {
          if (value != null) {
            if (value is List) {
              for (var item in value) {
                formData.fields.add(MapEntry('$key[]', item.toString()));
              }
            } else if (value is DateTime) {
              formData.fields.add(MapEntry(key, value.toIso8601String()));
            } else {
              formData.fields.add(MapEntry(key, value.toString()));
            }
          }
        });
        
        for (int i = 0; i < newImagePaths.length; i++) {
          String path = newImagePaths[i];
          
          if (path.startsWith('file://')) {
            path = path.replaceFirst('file://', '');
          }
          
          final file = File(path);
          if (await file.exists()) {
            final fileName = path.split('/').last;
            formData.files.add(MapEntry(
              'images',
              await MultipartFile.fromFile(path, filename: fileName),
            ));
          }
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
      developer.log('[ItemsService] Update error: $e');
      return ItemResult(success: false, error: _parseError(e));
    }
  }
  
  Future<bool> deleteItem(String id) async {
    try {
      await _api.delete('/items/$id');
      return true;
    } catch (e) {
      developer.log('[ItemsService] Delete error: $e');
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
    developer.log('[ItemsService] Parsing error: $e');
    
    if (e is DioException) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        return 'Connection timed out. Please check your internet connection.';
      }
      
      if (e.type == DioExceptionType.connectionError) {
        return 'Could not connect to server. Please check your internet connection.';
      }
      
      if (e.response?.data != null) {
        final data = e.response?.data;
        developer.log('[ItemsService] Error response data: $data');
        
        if (data is Map) {
          final message = data['message'] ?? data['error'] ?? data['msg'];
          if (message != null && message.toString().isNotEmpty) {
            return message.toString();
          }
          
          if (data['errors'] is List && (data['errors'] as List).isNotEmpty) {
            final errors = data['errors'] as List;
            if (errors.first is Map && errors.first['msg'] != null) {
              return errors.first['msg'].toString();
            }
            return errors.first.toString();
          }
          
          if (data['errors'] is Map) {
            final errorMap = data['errors'] as Map;
            final firstError = errorMap.values.first;
            if (firstError is String) return firstError;
            if (firstError is List && firstError.isNotEmpty) {
              return firstError.first.toString();
            }
          }
        }
        
        if (data is String && data.isNotEmpty) {
          return data;
        }
      }
      
      switch (e.response?.statusCode) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Please log in again to continue.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 413:
          return 'Image file is too large. Please choose a smaller image.';
        case 500:
          return 'Server error. Please try again later.';
        case 502:
        case 503:
        case 504:
          return 'Server is temporarily unavailable. Please try again.';
      }
    }
    
    if (e is FileSystemException) {
      return 'Could not access file: ${e.message}';
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