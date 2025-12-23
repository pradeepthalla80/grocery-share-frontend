import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/user_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  final UserService _userService = UserService();
  
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
  
  Future<void> initialize() async {
    if (_isInitialized) return;
    
    _isLoading = true;
    _safeNotifyListeners();
    
    final result = await _authService.getCurrentUser();
    if (result.success && result.user != null) {
      _user = result.user;
    }
    
    _isLoading = false;
    _isInitialized = true;
    _safeNotifyListeners();
  }
  
  void _safeNotifyListeners() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      notifyListeners();
    });
  }
  
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    final result = await _authService.login(email, password);
    
    _isLoading = false;
    if (result.success && result.user != null) {
      _user = result.user;
      notifyListeners();
      return true;
    }
    
    _error = result.error;
    notifyListeners();
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
    notifyListeners();
    
    final result = await _authService.register(
      name: name,
      email: email,
      password: password,
      zipCode: zipCode,
    );
    
    _isLoading = false;
    if (result.success && result.user != null) {
      _user = result.user;
      notifyListeners();
      return true;
    }
    
    _error = result.error;
    notifyListeners();
    return false;
  }
  
  Future<bool> googleSignIn() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    final result = await _authService.googleSignIn();
    
    _isLoading = false;
    if (result.success && result.user != null) {
      _user = result.user;
      notifyListeners();
      return true;
    }
    
    _error = result.error;
    notifyListeners();
    return false;
  }
  
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    
    await _authService.logout();
    
    _user = null;
    _isLoading = false;
    notifyListeners();
  }
  
  Future<bool> forgotPassword(String email) async {
    return await _authService.forgotPassword(email);
  }
  
  Future<bool> updateProfile(Map<String, dynamic> updates) async {
    _isLoading = true;
    notifyListeners();
    
    final result = await _userService.updateProfile(updates);
    
    _isLoading = false;
    if (result.success && result.user != null) {
      _user = result.user;
      notifyListeners();
      return true;
    }
    
    _error = result.error;
    notifyListeners();
    return false;
  }
  
  Future<bool> updateProfileImage(String imagePath) async {
    final result = await _userService.updateProfileImage(imagePath);
    
    if (result.success && result.user != null) {
      _user = result.user;
      notifyListeners();
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
      notifyListeners();
    }
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
