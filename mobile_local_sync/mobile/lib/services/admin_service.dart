import 'dart:developer' as developer;
import '../models/user.dart';
import '../models/item.dart';
import '../models/item_request.dart';
import 'api_client.dart';

class AdminService {
  final ApiClient _api = ApiClient();
  
  Future<AdminUsersResult> getUsers({int page = 1, int limit = 20, String? search}) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (search != null) queryParams['search'] = search;
      
      final response = await _api.get('/admin/users', queryParameters: queryParams);
      final users = (response.data['users'] as List<dynamic>)
          .map((u) => User.fromJson(u))
          .toList();
      
      return AdminUsersResult(
        success: true,
        users: users,
        total: response.data['total'],
        page: response.data['page'],
        totalPages: response.data['totalPages'],
      );
    } catch (e) {
      return AdminUsersResult(success: false, error: e.toString());
    }
  }
  
  Future<bool> updateUserRole(String userId, String role) async {
    try {
      developer.log('[AdminService] updateUserRole: userId=$userId, role=$role');
      await _api.patch('/admin/users/$userId/role', data: {'role': role});
      developer.log('[AdminService] updateUserRole succeeded');
      return true;
    } catch (e) {
      developer.log('[AdminService] updateUserRole FAILED: $e');
      return false;
    }
  }
  
  Future<bool> suspendUser(String userId) async {
    try {
      developer.log('[AdminService] suspendUser: userId=$userId');
      await _api.post('/admin/users/$userId/suspend');
      developer.log('[AdminService] suspendUser succeeded');
      return true;
    } catch (e) {
      developer.log('[AdminService] suspendUser FAILED: $e');
      return false;
    }
  }
  
  Future<bool> unsuspendUser(String userId) async {
    try {
      developer.log('[AdminService] unsuspendUser: userId=$userId');
      await _api.post('/admin/users/$userId/unsuspend');
      developer.log('[AdminService] unsuspendUser succeeded');
      return true;
    } catch (e) {
      developer.log('[AdminService] unsuspendUser FAILED: $e');
      return false;
    }
  }
  
  Future<bool> deleteUser(String userId) async {
    try {
      developer.log('[AdminService] deleteUser: userId=$userId');
      await _api.delete('/admin/users/$userId');
      developer.log('[AdminService] deleteUser succeeded');
      return true;
    } catch (e) {
      developer.log('[AdminService] deleteUser FAILED: $e');
      return false;
    }
  }
  
  Future<AdminItemsResult> getAllItems({int page = 1, int limit = 20, String? search}) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (search != null) queryParams['search'] = search;
      
      developer.log('[AdminService] Fetching items from /admin/items with params: $queryParams');
      
      final response = await _api.get('/admin/items', queryParameters: queryParams);
      
      developer.log('[AdminService] Items response status: ${response.statusCode}');
      developer.log('[AdminService] Items response data type: ${response.data.runtimeType}');
      
      if (response.data == null) {
        developer.log('[AdminService] ERROR: response.data is null');
        return AdminItemsResult(success: true, items: [], total: 0, page: 1, totalPages: 1);
      }
      
      developer.log('[AdminService] Items response data keys: ${response.data is Map ? response.data.keys : 'not a map'}');
      
      List<dynamic>? itemsData;
      if (response.data is Map) {
        itemsData = response.data['items'] ?? response.data['data'];
      } else if (response.data is List) {
        itemsData = response.data;
      }
      
      if (itemsData == null) {
        developer.log('[AdminService] ERROR: No items/data key found in response');
        developer.log('[AdminService] Full response: ${response.data}');
        return AdminItemsResult(
          success: false, 
          error: 'Unexpected response format from server. Expected "items" or "data" array.',
        );
      }
      
      final items = itemsData
          .map((i) {
            try {
              return Item.fromJson(i);
            } catch (e) {
              developer.log('[AdminService] Error parsing item: $e');
              return null;
            }
          })
          .whereType<Item>()
          .toList();
      
      developer.log('[AdminService] Successfully parsed ${items.length} items');
      
      int total = 0;
      int currentPage = page;
      int totalPages = 1;
      
      if (response.data is Map) {
        total = response.data['total'] ?? response.data['count'] ?? items.length;
        currentPage = response.data['page'] ?? response.data['currentPage'] ?? page;
        totalPages = response.data['totalPages'] ?? response.data['pages'] ?? 1;
      }
      
      return AdminItemsResult(
        success: true,
        items: items,
        total: total,
        page: currentPage,
        totalPages: totalPages,
      );
    } catch (e, stackTrace) {
      developer.log('[AdminService] ERROR fetching items: $e');
      developer.log('[AdminService] Stack trace: $stackTrace');
      return AdminItemsResult(success: false, error: e.toString());
    }
  }
  
  Future<bool> deleteItem(String itemId) async {
    try {
      developer.log('[AdminService] deleteItem: itemId=$itemId');
      await _api.delete('/admin/items/$itemId');
      developer.log('[AdminService] deleteItem succeeded');
      return true;
    } catch (e) {
      developer.log('[AdminService] deleteItem FAILED: $e');
      return false;
    }
  }
  
  Future<AdminRequestsResult> getAllRequests({int page = 1, int limit = 20}) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      
      final response = await _api.get('/admin/requests', queryParameters: queryParams);
      final requests = (response.data['requests'] as List<dynamic>)
          .map((r) => ItemRequest.fromJson(r))
          .toList();
      
      return AdminRequestsResult(
        success: true,
        requests: requests,
        total: response.data['total'],
        page: response.data['page'],
        totalPages: response.data['totalPages'],
      );
    } catch (e) {
      return AdminRequestsResult(success: false, error: e.toString());
    }
  }
  
  Future<bool> deleteRequest(String requestId) async {
    try {
      await _api.delete('/admin/requests/$requestId');
      return true;
    } catch (_) {
      return false;
    }
  }
  
  Future<AdminStatsResult> getDashboardStats() async {
    try {
      final response = await _api.get('/admin/stats');
      return AdminStatsResult(
        success: true,
        totalUsers: response.data['totalUsers'] ?? 0,
        totalItems: response.data['totalItems'] ?? 0,
        totalRequests: response.data['totalRequests'] ?? 0,
        activeItems: response.data['activeItems'] ?? 0,
        completedExchanges: response.data['completedExchanges'] ?? 0,
        storeOwners: response.data['storeOwners'] ?? 0,
      );
    } catch (e) {
      return AdminStatsResult(success: false, error: e.toString());
    }
  }
}

class AdminUsersResult {
  final bool success;
  final List<User>? users;
  final int? total;
  final int? page;
  final int? totalPages;
  final String? error;
  
  AdminUsersResult({
    required this.success,
    this.users,
    this.total,
    this.page,
    this.totalPages,
    this.error,
  });
}

class AdminItemsResult {
  final bool success;
  final List<Item>? items;
  final int? total;
  final int? page;
  final int? totalPages;
  final String? error;
  
  AdminItemsResult({
    required this.success,
    this.items,
    this.total,
    this.page,
    this.totalPages,
    this.error,
  });
}

class AdminRequestsResult {
  final bool success;
  final List<ItemRequest>? requests;
  final int? total;
  final int? page;
  final int? totalPages;
  final String? error;
  
  AdminRequestsResult({
    required this.success,
    this.requests,
    this.total,
    this.page,
    this.totalPages,
    this.error,
  });
}

class AdminStatsResult {
  final bool success;
  final int totalUsers;
  final int totalItems;
  final int totalRequests;
  final int activeItems;
  final int completedExchanges;
  final int storeOwners;
  final String? error;
  
  AdminStatsResult({
    required this.success,
    this.totalUsers = 0,
    this.totalItems = 0,
    this.totalRequests = 0,
    this.activeItems = 0,
    this.completedExchanges = 0,
    this.storeOwners = 0,
    this.error,
  });
}
