import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/user_service.dart';

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
  
  Future<void> initialize() async {
    if (_isInitialized) return;
    
    _isLoading = true;
    _safeNotify();
    
    final result = await _authService.getCurrentUser();
    if (result.success && result.user != null) {
      _user = result.user;
    }
    
    _isLoading = false;
    _isInitialized = true;
    _safeNotify();
  }
  
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    _safeNotify();
    
    final result = await _authService.login(email, password);
    
    _isLoading = false;
    if (result.success && result.user != null) {
      _user = result.user;
      _safeNotify();
      return true;
    }
    
    _error = result.error;
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
    
    final result = await _authService.register(
      name: name,
      email: email,
      password: password,
      zipCode: zipCode,
    );
    
    _isLoading = false;
    if (result.success && result.user != null) {
      _user = result.user;
      _safeNotify();
      return true;
    }
    
    _error = result.error;
    _safeNotify();
    return false;
  }
  
  Future<bool> googleSignIn() async {
    _isLoading = true;
    _error = null;
    _safeNotify();
    
    try {
      final result = await _authService.googleSignIn();
      
      _isLoading = false;
      
      if (result.success && result.user != null) {
        _user = result.user;
        _safeNotify();
        return true;
      }
      
      _error = result.error;
      _safeNotify();
      return false;
    } catch (e) {
      _isLoading = false;
      _error = 'Google sign-in failed. Please try again.';
      _safeNotify();
      return false;
    }
  }
  
  Future<void> logout() async {
    _isLoading = true;
    _safeNotify();
    
    await _authService.logout();
    
    _user = null;
    _isLoading = false;
    _safeNotify();
  }
  
  Future<bool> forgotPassword(String email) async {
    return await _authService.forgotPassword(email);
  }
  
  Future<bool> updateProfile(Map<String, dynamic> updates) async {
    _isLoading = true;
    _safeNotify();
    
    final result = await _userService.updateProfile(updates);
    
    _isLoading = false;
    if (result.success && result.user != null) {
      _user = result.user;
      _safeNotify();
      return true;
    }
    
    _error = result.error;
    _safeNotify();
    return false;
  }
  
  Future<bool> updateProfileImage(String imagePath) async {
    final result = await _userService.updateProfileImage(imagePath);
    
    if (result.success && result.user != null) {
      _user = result.user;
      _safeNotify();
      return true;
    }
    return false;
  }
  
  Future<bool> activateStoreMode({
    required String storeName,
    String? storeDescription,
  }) async {
    final success = await _userService.activateStoreMode(
      storeName: storeName,
      storeDescription: storeDescription,
    );
    
    if (success) {
      await refreshUser();
    }
    return success;
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
  
  Future<void> refreshUser() async {
    final result = await _authService.getCurrentUser();
    if (result.success && result.user != null) {
      _user = result.user;
      _safeNotify();
    }
  }
  
  void clearError() {
    _error = null;
    _safeNotify();
  }
}
