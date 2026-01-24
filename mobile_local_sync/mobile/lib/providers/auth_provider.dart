import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/user_service.dart';

export '../services/user_service.dart' show StoreActivationResult;

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  final UserService _userService = UserService();

  bool _disposed = false;

  User? _user;
  bool _isLoading = false;
  bool _isInitialized = false;
  String? _error;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  bool get isAuthenticated => _user != null;
  String? get error => _error;

  bool get isAdmin => _user?.isAdmin ?? false;
  bool get isSuperAdmin => _user?.isSuperAdmin ?? false;
  bool get isStoreOwner => _user?.isStoreOwner ?? false;
  bool get hasStripeAccount => _user?.hasStripeAccount ?? false;

  void _safeNotify() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_disposed) {
        notifyListeners();
      }
    });
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }

  // ---------------- INIT ----------------

  Future<void> initialize() async {
    if (_isInitialized) return;

    _isLoading = true;
    _safeNotify();

    try {
      final result = await _authService.getCurrentUser();
      if (result.success && result.user != null) {
        _user = result.user;
      }
    } catch (_) {}

    _isLoading = false;
    _isInitialized = true;
    _safeNotify();
  }

  // ---------------- AUTH ----------------

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    _safeNotify();

    try {
      await _authService.login(email, password);

      final result = await _authService.getCurrentUser();
      if (result.success && result.user != null) {
        _user = result.user;
        _isLoading = false;
        _safeNotify();
        return true;
      }

      _error = result.error ?? 'Login failed';
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    _safeNotify();
    return false;
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    String? zipCode,
  }) async {
    _isLoading = true;
    _error = null;
    _safeNotify();

    try {
      await _authService.register(
        name: name,
        email: email,
        password: password,
        zipCode: zipCode,
      );

      final result = await _authService.getCurrentUser();
      if (result.success && result.user != null) {
        _user = result.user;
        _isLoading = false;
        _safeNotify();
        return true;
      }

      _error = result.error ?? 'Registration failed';
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    _safeNotify();
    return false;
  }

  Future<bool> googleSignIn() async {
    _isLoading = true;
    _error = null;
    _safeNotify();

    try {
      await _authService.googleSignIn();

      final result = await _authService.getCurrentUser();
      if (result.success && result.user != null) {
        _user = result.user;
        _isLoading = false;
        _safeNotify();
        return true;
      }

      _error = result.error ?? 'Google sign-in failed';
    } catch (_) {
      _error = 'Google sign-in failed';
    }

    _isLoading = false;
    _safeNotify();
    return false;
  }

  Future<void> logout() async {
    _isLoading = true;
    _safeNotify();

    try {
      await _authService.logout();
    } catch (_) {}

    _user = null;
    _isLoading = false;
    _safeNotify();
  }

  Future<bool> forgotPassword(String email) async {
    try {
      return await _authService.forgotPassword(email);
    } catch (_) {
      return false;
    }
  }

  // ---------------- PROFILE ----------------

  Future<bool> updateProfile(Map<String, dynamic> updates) async {
    _isLoading = true;
    _safeNotify();

    try {
      final result = await _userService.updateProfile(updates);

      if (result.success && result.user != null) {
        _user = result.user;
        _isLoading = false;
        _safeNotify();
        return true;
      }

      _error = result.error ?? 'Profile update failed';
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    _safeNotify();
    return false;
  }

  Future<bool> updateProfileImage(String imagePath) async {
    try {
      final result = await _userService.updateProfileImage(imagePath);

      if (result.success && result.user != null) {
        _user = result.user;
        _safeNotify();
        return true;
      }
    } catch (_) {}

    return false;
  }

  // ---------------- STORE ----------------

  Future<StoreActivationResult> activateStoreMode({
    required String storeName,
    String? storeDescription,
  }) async {
    final result = await _userService.activateStoreMode(
      storeName: storeName,
      storeDescription: storeDescription,
    );

    if (result.success) {
      await refreshUser();
    }

    return result;
  }

  Future<bool> acceptStoreTerms() async {
    final success = await _userService.acceptStoreTerms();

    if (success) {
      await refreshUser();
    }

    return success;
  }

  Future<bool> deactivateStoreMode() async {
    final success = await _userService.deactivateStoreMode();

    if (success) {
      await refreshUser();
    }

    return success;
  }

  // ---------------- UTIL ----------------

  Future<void> refreshUser() async {
    try {
      final result = await _authService.getCurrentUser();
      if (result.success && result.user != null) {
        _user = result.user;
        _safeNotify();
      }
    } catch (_) {}
  }

  void clearError() {
    _error = null;
    _safeNotify();
  }
}
