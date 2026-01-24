import 'package:url_launcher/url_launcher.dart';

import '../config/app_config.dart';
import '../models/user.dart';
import 'api_client.dart';

class AuthService {
  final ApiClient _api = ApiClient();

  // =========================
  // EMAIL LOGIN
  // =========================

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

  // =========================
  // REGISTER
  // =========================

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

  // =========================
  // GOOGLE SIGN IN (MOBILE SAFE)
  // =========================

  Future<void> googleSignIn() async {
    try {
      final authUrl =
          '${AppConfig.backendBaseUrl}/api/v1/auth/google?platform=mobile';

      final uri = Uri.parse(authUrl);

      final launched = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );

      if (!launched) {
        throw Exception('Could not launch Google sign-in');
      }
    } catch (e) {
      throw Exception('Google sign-in failed');
    }
  }

  // =========================
  // CURRENT USER
  // =========================

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

  // =========================
  // LOGOUT
  // =========================

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (_) {}
    await _api.clearTokens();
  }

  // =========================
  // PASSWORD FLOWS
  // =========================

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

  // =========================
  // ERROR PARSER
  // =========================

  String _parseError(dynamic e) {
    final message = e.toString();

    if (message.contains('SocketException')) {
      return 'Network connection failed';
    }

    if (message.contains('TimeoutException')) {
      return 'Request timeout';
    }

    if (message.contains('Exception:')) {
      return message.split('Exception:').last.trim();
    }

    return 'Something went wrong. Please try again.';
  }
}

// =========================
// RESULT MODEL
// =========================

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
