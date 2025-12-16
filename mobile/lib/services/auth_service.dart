import 'package:google_sign_in/google_sign_in.dart';

import '../config/app_config.dart';
import '../models/user.dart';
import 'api_client.dart';

class AuthService {
  final ApiClient _api = ApiClient();
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    clientId: AppConfig.googleClientId,
    scopes: ['email', 'profile'],
  );
  
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
  }) async {
    try {
      final response = await _api.post('/auth/register', data: {
        'name': name,
        'email': email,
        'password': password,
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
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        return AuthResult(success: false, error: 'Google sign-in cancelled');
      }
      
      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;
      
      if (idToken == null) {
        return AuthResult(success: false, error: 'Failed to get Google ID token');
      }
      
      final response = await _api.post('/auth/google', data: {
        'idToken': idToken,
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
  
  Future<void> googleSignOut() async {
    await _googleSignIn.signOut();
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
    await googleSignOut();
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
    if (e is Exception) {
      final message = e.toString();
      if (message.contains('DioException')) {
        return 'Network error. Please check your connection.';
      }
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
