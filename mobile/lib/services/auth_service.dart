import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';

import '../config/app_config.dart';
import '../models/user.dart';
import 'api_client.dart';

class AuthService {
  final ApiClient _api = ApiClient();
  
  Future<AuthResult> login(String email, String password) async {
    try {
      final response = await _api.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      
      final data = response.data;
      final token = data['token'];
      final user = User.fromJson(data['user']);
      
      await _api.setToken(token);
      
      return AuthResult(success: true, user: user, token: token);
    } catch (e) {
      return AuthResult(success: false, error: _parseError(e));
    }
  }
  
  Future<AuthResult> register({
    required String name,
    required String email,
    required String password,
    String? zipCode,
    bool acceptedTerms = true,
  }) async {
    try {
      final response = await _api.post('/auth/register', data: {
        'name': name,
        'email': email,
        'password': password,
        'acceptedTerms': acceptedTerms,
        if (zipCode != null) 'zipCode': zipCode,
      });
      
      final data = response.data;
      final token = data['token'];
      final user = User.fromJson(data['user']);
      
      await _api.setToken(token);
      
      return AuthResult(success: true, user: user, token: token);
    } catch (e) {
      return AuthResult(success: false, error: _parseError(e));
    }
  }
  
  Future<AuthResult> googleSignIn() async {
    try {
      final authUrl = '${AppConfig.backendBaseUrl}/api/v1/auth/google?platform=mobile';
      final callbackUrlScheme = AppConfig.googleAuthCallbackScheme;
      
      final result = await FlutterWebAuth2.authenticate(
        url: authUrl,
        callbackUrlScheme: callbackUrlScheme,
      );
      
      final uri = Uri.parse(result);
      final token = uri.queryParameters['token'];
      
      if (token == null || token.isEmpty) {
        final error = uri.queryParameters['error'];
        return AuthResult(
          success: false, 
          error: error ?? 'Google sign-in failed. No token received.',
        );
      }
      
      await _api.setToken(token);
      
      final userResult = await getCurrentUser();
      if (userResult.success && userResult.user != null) {
        return AuthResult(success: true, user: userResult.user, token: token);
      }
      
      return AuthResult(success: true, token: token);
    } catch (e) {
      if (e.toString().contains('CANCELED') || 
          e.toString().contains('cancelled') ||
          e.toString().contains('user_cancelled')) {
        return AuthResult(success: false, error: 'Google sign-in cancelled');
      }
      return AuthResult(success: false, error: _parseError(e));
    }
  }
  
  Future<AuthResult> getCurrentUser() async {
    try {
      final hasToken = await _api.hasToken();
      if (!hasToken) {
        return AuthResult(success: false, error: 'No token found');
      }
      
      final response = await _api.get('/auth/me');
      final user = User.fromJson(response.data['user']);
      
      return AuthResult(success: true, user: user);
    } catch (e) {
      await _api.clearTokens();
      return AuthResult(success: false, error: _parseError(e));
    }
  }
  
  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (_) {}
    await _api.clearTokens();
  }
  
  Future<bool> forgotPassword(String email) async {
    try {
      await _api.post('/auth/forgot-password', data: {'email': email});
      return true;
    } catch (_) {
      return false;
    }
  }
  
  Future<bool> resetPassword(String token, String password) async {
    try {
      await _api.post('/auth/reset-password', data: {
        'token': token,
        'password': password,
      });
      return true;
    } catch (_) {
      return false;
    }
  }
  
  Future<bool> changePassword(String currentPassword, String newPassword) async {
    try {
      await _api.put('/auth/change-password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });
      return true;
    } catch (_) {
      return false;
    }
  }
  
  String _parseError(dynamic e) {
    if (e.toString().contains('DioException')) {
      try {
        final dynamic response = (e as dynamic).response;
        if (response != null) {
          final data = response.data;
          if (data is Map) {
            if (data['message'] != null) {
              return data['message'].toString();
            }
            if (data['error'] != null) {
              return data['error'].toString();
            }
          }
          if (data is String && data.isNotEmpty) {
            return data;
          }
        }
        final String errorString = e.toString();
        if (errorString.contains('SocketException') || 
            errorString.contains('Connection refused')) {
          return 'Unable to connect to server. Please check your internet connection.';
        }
        if (errorString.contains('TimeoutException') ||
            errorString.contains('CONNECT_TIMEOUT') ||
            errorString.contains('RECEIVE_TIMEOUT')) {
          return 'Connection timed out. Please try again.';
        }
      } catch (_) {}
      return 'Network error. Please check your connection.';
    }
    
    final message = e.toString();
    if (message.contains('Exception:')) {
      return message.split('Exception:').last.trim();
    }
    return 'An error occurred. Please try again.';
  }
}

class AuthResult {
  final bool success;
  final User? user;
  final String? token;
  final String? error;
  
  AuthResult({
    required this.success,
    this.user,
    this.token,
    this.error,
  });
}
