import 'package:flutter/foundation.dart';

import '../models/item_request.dart';
import '../models/pickup_request.dart';
import '../services/requests_service.dart';
import 'auth_provider.dart';

class RequestsProvider with ChangeNotifier {
  final RequestsService _requestsService = RequestsService();
  
  AuthProvider? _authProvider;
  
  List<ItemRequest> _itemRequests = [];
  List<ItemRequest> _myRequests = [];
  List<PickupRequest> _pickupRequests = [];
  ItemRequest? _currentRequest;
  
  bool _isLoading = false;
  String? _error;
  
  int _currentPage = 1;
  int _totalPages = 1;
  
  List<ItemRequest> get itemRequests => _itemRequests;
  List<ItemRequest> get myRequests => _myRequests;
  List<PickupRequest> get pickupRequests => _pickupRequests;
  ItemRequest? get currentRequest => _currentRequest;
  
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasMore => _currentPage < _totalPages;
  
  List<PickupRequest> get pendingPickups =>
      _pickupRequests.where((r) => r.isPending).toList();
  
  List<PickupRequest> get activePickups =>
      _pickupRequests.where((r) => r.isAccepted || r.isAwaitingPickup).toList();
  
  List<PickupRequest> get completedPickups =>
      _pickupRequests.where((r) => r.isCompleted).toList();
  
  void updateAuth(AuthProvider auth) {
    _authProvider = auth;
  }
  
  Future<void> fetchItemRequests({
    String? search,
    String? category,
    double? latitude,
    double? longitude,
    int? radius,
    bool refresh = false,
  }) async {
    if (refresh) {
      _currentPage = 1;
      _itemRequests = [];
    }
    
    _isLoading = _itemRequests.isEmpty;
    _error = null;
    notifyListeners();
    
    final result = await _requestsService.getItemRequests(
      search: search,
      category: category,
      latitude: latitude,
      longitude: longitude,
      radius: radius,
      page: _currentPage,
    );
    
    _isLoading = false;
    
    if (result.success && result.requests != null) {
      _itemRequests = result.requests!;
      _totalPages = result.totalPages ?? 1;
    } else {
      _error = result.error;
    }
    
    notifyListeners();
  }
  
  Future<void> fetchMyRequests() async {
    _isLoading = true;
    notifyListeners();
    
    final result = await _requestsService.getMyRequests();
    
    _isLoading = false;
    
    if (result.success && result.requests != null) {
      _myRequests = result.requests!;
    }
    
    notifyListeners();
  }
  
  Future<bool> fetchRequest(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    final result = await _requestsService.getItemRequest(id);
    
    _isLoading = false;
    
    if (result.success && result.request != null) {
      _currentRequest = result.request;
      notifyListeners();
      return true;
    }
    
    _error = result.error;
    notifyListeners();
    return false;
  }
  
  Future<ItemRequest?> createRequest({
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
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    final result = await _requestsService.createRequest(
      title: title,
      description: description,
      category: category,
      tags: tags,
      quantity: quantity,
      unit: unit,
      pricePreference: pricePreference,
      maxPrice: maxPrice,
      address: address,
      latitude: latitude,
      longitude: longitude,
      zipCode: zipCode,
      validUntil: validUntil,
    );
    
    _isLoading = false;
    
    if (result.success && result.request != null) {
      _myRequests.insert(0, result.request!);
      notifyListeners();
      return result.request;
    }
    
    _error = result.error;
    notifyListeners();
    return null;
  }
  
  Future<bool> updateRequest(String id, Map<String, dynamic> updates) async {
    final result = await _requestsService.updateRequest(id, updates);
    
    if (result.success && result.request != null) {
      final index = _myRequests.indexWhere((r) => r.id == id);
      if (index != -1) {
        _myRequests[index] = result.request!;
      }
      if (_currentRequest?.id == id) {
        _currentRequest = result.request;
      }
      notifyListeners();
      return true;
    }
    
    return false;
  }
  
  Future<bool> deleteRequest(String id) async {
    final success = await _requestsService.deleteRequest(id);
    
    if (success) {
      _myRequests.removeWhere((r) => r.id == id);
      _itemRequests.removeWhere((r) => r.id == id);
      if (_currentRequest?.id == id) {
        _currentRequest = null;
      }
      notifyListeners();
    }
    
    return success;
  }
  
  Future<bool> respondToRequest({
    required String requestId,
    required String message,
    required bool isFree,
    double? price,
    bool? offersDelivery,
    double? deliveryFee,
  }) async {
    return await _requestsService.respondToRequest(
      requestId: requestId,
      message: message,
      isFree: isFree,
      price: price,
      offersDelivery: offersDelivery,
      deliveryFee: deliveryFee,
    );
  }
  
  Future<void> fetchPickupRequests() async {
    _isLoading = true;
    notifyListeners();
    
    final result = await _requestsService.getPickupRequests();
    
    _isLoading = false;
    
    if (result.success && result.requests != null) {
      _pickupRequests = result.requests!;
    }
    
    notifyListeners();
  }
  
  Future<PickupRequest?> createPickupRequest({
    required String itemId,
    required String message,
    int quantity = 1,
  }) async {
    final result = await _requestsService.createPickupRequest(
      itemId: itemId,
      message: message,
      quantity: quantity,
    );
    
    if (result.success && result.request != null) {
      _pickupRequests.insert(0, result.request!);
      notifyListeners();
      return result.request;
    }
    
    return null;
  }
  
  Future<bool> updatePickupStatus(String id, String status) async {
    final result = await _requestsService.updatePickupStatus(id, status);
    
    if (result.success && result.request != null) {
      final index = _pickupRequests.indexWhere((r) => r.id == id);
      if (index != -1) {
        _pickupRequests[index] = result.request!;
      }
      notifyListeners();
      return true;
    }
    
    return false;
  }
  
  Future<bool> revealAddress(String conversationId) async {
    return await _requestsService.revealAddress(conversationId);
  }
  
  void clearCurrentRequest() {
    _currentRequest = null;
    notifyListeners();
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
