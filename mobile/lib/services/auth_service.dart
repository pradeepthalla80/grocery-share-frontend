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
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        return AuthResult(success: false, error: 'Google sign-in cancelled');
      }
      
      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;
      final accessToken = googleAuth.accessToken;
      
      if (idToken == null) {
        // Sign out of Google to reset state
        await _googleSignIn.signOut();
        return AuthResult(success: false, error: 'Failed to get Google ID token');
      }
      
      // Try /auth/google/mobile endpoint (accepts ID token directly)
      try {
        final response = await _api.post('/auth/google/mobile', data: {
          'idToken': idToken,
          'accessToken': accessToken,
          'email': googleUser.email,
          'name': googleUser.displayName,
          'googleId': googleUser.id,
        });
        
        final data = response.data;
        final token = data['token'];
        final user = User.fromJson(data['user']);
        
        await _api.setToken(token);
        
        return AuthResult(success: true, user: user, token: token);
      } catch (e) {
        // Always sign out of Google on backend failure to reset state
        await _googleSignIn.signOut();
        
        // Check if it's a 404 (endpoint doesn't exist)
        final errorStr = e.toString();
        if (errorStr.contains('404') || errorStr.contains('Route not found')) {
          // Backend doesn't have mobile Google auth endpoint yet
          return AuthResult(
            success: false, 
            error: 'Google sign-in is not yet available on mobile. Please use email/password to sign in.',
          );
        }
        // Return parsed error instead of rethrowing
        return AuthResult(success: false, error: _parseError(e));
      }
    } catch (e) {
      // Sign out of Google on any error to reset state
      try {
        await _googleSignIn.signOut();
      } catch (_) {}
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
    // Try to extract server error message from DioException
    if (e.toString().contains('DioException')) {
      try {
        // Access response data if available
        final dynamic response = (e as dynamic).response;
        if (response != null) {
          final data = response.data;
          if (data is Map) {
            // Try common error message fields
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
        // Check for connection/timeout errors
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
      } catch (_) {
        // Fallback if we can't parse the error
      }
      return 'Network error. Please check your connection.';
    }
    
    // Handle other exception types
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
