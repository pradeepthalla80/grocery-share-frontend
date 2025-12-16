import 'package:dio/dio.dart';

import '../models/user.dart';
import '../models/rating.dart';
import 'api_client.dart';

class UserService {
  final ApiClient _api = ApiClient();
  
  Future<UserResult> getProfile(String userId) async {
    try {
      final response = await _api.get('/users/$userId');
      final user = User.fromJson(response.data['user'] ?? response.data);
      return UserResult(success: true, user: user);
    } catch (e) {
      return UserResult(success: false, error: _parseError(e));
    }
  }
  
  Future<UserResult> updateProfile(Map<String, dynamic> updates) async {
    try {
      final response = await _api.put('/users/profile', data: updates);
      final user = User.fromJson(response.data['user'] ?? response.data);
      return UserResult(success: true, user: user);
    } catch (e) {
      return UserResult(success: false, error: _parseError(e));
    }
  }
  
  Future<UserResult> updateProfileImage(String imagePath) async {
    try {
      final formData = FormData.fromMap({
        'profileImage': await MultipartFile.fromFile(imagePath),
      });
      
      final response = await _api.uploadFile('/users/profile-image', formData: formData);
      final user = User.fromJson(response.data['user'] ?? response.data);
      return UserResult(success: true, user: user);
    } catch (e) {
      return UserResult(success: false, error: _parseError(e));
    }
  }
  
  Future<bool> activateStoreMode({
    required String storeName,
    String? storeDescription,
  }) async {
    try {
      await _api.post('/users/activate-store', data: {
        'storeName': storeName,
        if (storeDescription != null) 'storeDescription': storeDescription,
      });
      return true;
    } catch (_) {
      return false;
    }
  }
  
  Future<bool> acceptStoreTerms() async {
    try {
      await _api.post('/users/accept-store-terms');
      return true;
    } catch (_) {
      return false;
    }
  }
  
  Future<bool> deactivateStoreMode() async {
    try {
      await _api.post('/users/deactivate-store');
      return true;
    } catch (_) {
      return false;
    }
  }
  
  Future<RatingsResult> getUserRatings(String userId) async {
    try {
      final response = await _api.get('/users/$userId/ratings');
      final ratings = (response.data['ratings'] as List<dynamic>)
          .map((r) => Rating.fromJson(r))
          .toList();
      
      return RatingsResult(
        success: true,
        ratings: ratings,
        averageRating: (response.data['averageRating'] ?? 0).toDouble(),
        totalRatings: response.data['totalRatings'] ?? ratings.length,
      );
    } catch (e) {
      return RatingsResult(success: false, error: _parseError(e));
    }
  }
  
  Future<bool> rateUser({
    required String rateeId,
    required int rating,
    String? comment,
    String? pickupRequestId,
  }) async {
    try {
      await _api.post('/users/rate', data: {
        'rateeId': rateeId,
        'rating': rating,
        if (comment != null) 'comment': comment,
        if (pickupRequestId != null) 'pickupRequestId': pickupRequestId,
      });
      return true;
    } catch (_) {
      return false;
    }
  }
  
  Future<bool> deleteAccount() async {
    try {
      await _api.delete('/users/account');
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

class UserResult {
  final bool success;
  final User? user;
  final String? error;
  
  UserResult({
    required this.success,
    this.user,
    this.error,
  });
}

class RatingsResult {
  final bool success;
  final List<Rating>? ratings;
  final double averageRating;
  final int totalRatings;
  final String? error;
  
  RatingsResult({
    required this.success,
    this.ratings,
    this.averageRating = 0,
    this.totalRatings = 0,
    this.error,
  });
}
