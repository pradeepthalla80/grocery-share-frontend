import 'dart:developer' as developer;
import 'package:dio/dio.dart';

import '../models/item_request.dart';
import '../models/pickup_request.dart';
import 'api_client.dart';

class RequestsService {
  final ApiClient _api = ApiClient();
  
  Future<ItemRequestsResult> getItemRequests({
    String? search,
    String? category,
    double? latitude,
    double? longitude,
    int? radius,
    String? pricePreference,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (category != null) queryParams['category'] = category;
      if (latitude != null) queryParams['latitude'] = latitude;
      if (longitude != null) queryParams['longitude'] = longitude;
      if (radius != null) queryParams['radius'] = radius;
      if (pricePreference != null) queryParams['pricePreference'] = pricePreference;
      
      final response = await _api.get('/requests', queryParameters: queryParams);
      final requests = (response.data['requests'] as List<dynamic>)
          .map((r) => ItemRequest.fromJson(r))
          .toList();
      
      return ItemRequestsResult(
        success: true,
        requests: requests,
        total: response.data['total'],
        page: response.data['page'],
        totalPages: response.data['totalPages'],
      );
    } catch (e) {
      return ItemRequestsResult(success: false, error: _parseError(e));
    }
  }
  
  Future<ItemRequestResult> getItemRequest(String id) async {
    try {
      final response = await _api.get('/requests/$id');
      final request = ItemRequest.fromJson(response.data['request'] ?? response.data);
      return ItemRequestResult(success: true, request: request);
    } catch (e) {
      return ItemRequestResult(success: false, error: _parseError(e));
    }
  }
  
  Future<ItemRequestsResult> getMyRequests() async {
    try {
      final response = await _api.get('/requests/my-requests');
      final requests = (response.data['requests'] as List<dynamic>)
          .map((r) => ItemRequest.fromJson(r))
          .toList();
      
      return ItemRequestsResult(success: true, requests: requests);
    } catch (e) {
      return ItemRequestsResult(success: false, error: _parseError(e));
    }
  }
  
  Future<ItemRequestResult> createRequest({
    required String title,
    required String description,
    required String category,
    List<String>? tags,
    required int quantity,
    String? unit,
    String? pricePreference,
    double? maxPrice,
    String? address,
    double? latitude,
    double? longitude,
    String? zipCode,
    required DateTime validUntil,
  }) async {
    try {
      final response = await _api.post('/requests', data: {
        'title': title,
        'description': description,
        'category': category,
        if (tags != null) 'tags': tags,
        'quantity': quantity,
        if (unit != null) 'unit': unit,
        if (pricePreference != null) 'pricePreference': pricePreference,
        if (maxPrice != null) 'maxPrice': maxPrice,
        if (address != null) 'address': address,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (zipCode != null) 'zipCode': zipCode,
        'validUntil': validUntil.toIso8601String(),
      });
      
      final request = ItemRequest.fromJson(response.data['request'] ?? response.data);
      return ItemRequestResult(success: true, request: request);
    } catch (e) {
      return ItemRequestResult(success: false, error: _parseError(e));
    }
  }
  
  Future<ItemRequestResult> updateRequest(String id, Map<String, dynamic> updates) async {
    try {
      final response = await _api.put('/requests/$id', data: updates);
      final request = ItemRequest.fromJson(response.data['request'] ?? response.data);
      return ItemRequestResult(success: true, request: request);
    } catch (e) {
      return ItemRequestResult(success: false, error: _parseError(e));
    }
  }
  
  Future<bool> deleteRequest(String id) async {
    try {
      await _api.delete('/requests/$id');
      return true;
    } catch (_) {
      return false;
    }
  }
  
  Future<bool> respondToRequest({
    required String requestId,
    required String message,
    required bool isFree,
    double? price,
    bool? offersDelivery,
    double? deliveryFee,
  }) async {
    try {
      await _api.post('/requests/$requestId/respond', data: {
        'message': message,
        'isFree': isFree,
        if (price != null) 'price': price,
        if (offersDelivery != null) 'offersDelivery': offersDelivery,
        if (deliveryFee != null) 'deliveryFee': deliveryFee,
      });
      return true;
    } catch (_) {
      return false;
    }
  }
  
  Future<PickupRequestsResult> getPickupRequests() async {
    try {
      final response = await _api.get('/pickup-requests');
      final requests = (response.data['requests'] as List<dynamic>)
          .map((r) => PickupRequest.fromJson(r))
          .toList();
      
      return PickupRequestsResult(success: true, requests: requests);
    } catch (e) {
      return PickupRequestsResult(success: false, error: _parseError(e));
    }
  }
  
  Future<PickupRequestResult> createPickupRequest({
    required String itemId,
    required String message,
    int quantity = 1,
  }) async {
    try {
      developer.log('[RequestsService] createPickupRequest: itemId=$itemId, quantity=$quantity');
      developer.log('[RequestsService] message: $message');
      
      final response = await _api.post('/pickup-requests', data: {
        'itemId': itemId,
        'message': message,
        'quantity': quantity,
      });
      
      developer.log('[RequestsService] Pickup request created: ${response.data}');
      
      final request = PickupRequest.fromJson(response.data['request'] ?? response.data);
      return PickupRequestResult(success: true, request: request);
    } catch (e) {
      developer.log('[RequestsService] ERROR creating pickup request: $e');
      if (e is DioException) {
        developer.log('[RequestsService] Response status: ${e.response?.statusCode}');
        developer.log('[RequestsService] Response data: ${e.response?.data}');
      }
      return PickupRequestResult(success: false, error: _parseError(e));
    }
  }
  
  Future<PickupRequestResult> updatePickupStatus(String id, String status) async {
    try {
      final response = await _api.patch('/pickup-requests/$id/status', data: {
        'status': status,
      });
      
      final request = PickupRequest.fromJson(response.data['request'] ?? response.data);
      return PickupRequestResult(success: true, request: request);
    } catch (e) {
      return PickupRequestResult(success: false, error: _parseError(e));
    }
  }
  
  Future<bool> revealAddress(String conversationId) async {
    try {
      await _api.post('/pickup-requests/reveal-address', data: {
        'conversationId': conversationId,
      });
      return true;
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

class ItemRequestsResult {
  final bool success;
  final List<ItemRequest>? requests;
  final int? total;
  final int? page;
  final int? totalPages;
  final String? error;
  
  ItemRequestsResult({
    required this.success,
    this.requests,
    this.total,
    this.page,
    this.totalPages,
    this.error,
  });
}

class ItemRequestResult {
  final bool success;
  final ItemRequest? request;
  final String? error;
  
  ItemRequestResult({
    required this.success,
    this.request,
    this.error,
  });
}

class PickupRequestsResult {
  final bool success;
  final List<PickupRequest>? requests;
  final String? error;
  
  PickupRequestsResult({
    required this.success,
    this.requests,
    this.error,
  });
}

class PickupRequestResult {
  final bool success;
  final PickupRequest? request;
  final String? error;
  
  PickupRequestResult({
    required this.success,
    this.request,
    this.error,
  });
}
