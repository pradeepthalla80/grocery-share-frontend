import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class LocationProvider with ChangeNotifier {
  Position? _currentPosition;
  String? _currentAddress;
  String? _zipCode;
  bool _isLoading = false;
  String? _error;
  bool _permissionGranted = false;
  bool _permissionDeniedForever = false;
  bool _disposed = false;
  bool _isIPLocation = false;
  
  Position? get currentPosition => _currentPosition;
  String? get currentAddress => _currentAddress;
  String? get zipCode => _zipCode;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasLocation => _currentPosition != null;
  bool get permissionGranted => _permissionGranted;
  bool get isIPLocation => _isIPLocation;
  
  double? get latitude => _currentPosition?.latitude;
  double? get longitude => _currentPosition?.longitude;
  
  static const String _locationCacheKey = 'cached_location';
  static const int _cacheValidityHours = 24;
  
  void _safeNotify() {
    if (_disposed) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_disposed) {
        notifyListeners();
      }
    });
  }
  
  void _immediateNotify() {
    if (!_disposed) {
      notifyListeners();
    }
  }
  
  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }
  
  Future<bool> initializeLocation() async {
    _isLoading = true;
    _error = null;
    _immediateNotify();
    
    try {
      final cachedLocation = await _loadCachedLocation();
      if (cachedLocation != null) {
        _currentPosition = Position(
          latitude: cachedLocation['lat'],
          longitude: cachedLocation['lng'],
          timestamp: DateTime.now(),
          accuracy: 0,
          altitude: 0,
          altitudeAccuracy: 0,
          heading: 0,
          headingAccuracy: 0,
          speed: 0,
          speedAccuracy: 0,
        );
        _currentAddress = cachedLocation['address'];
        _isIPLocation = cachedLocation['isIP'] ?? true;
        _isLoading = false;
        _safeNotify();
        return true;
      }
      
      final success = await getLocationFromIP();
      _isLoading = false;
      _safeNotify();
      return success;
    } catch (e) {
      _isLoading = false;
      _safeNotify();
      return false;
    }
  }
  
  Future<bool> getLocationFromIP() async {
    try {
      final dio = Dio();
      dio.options.connectTimeout = const Duration(seconds: 10);
      dio.options.receiveTimeout = const Duration(seconds: 10);
      
      final response = await dio.get('http://ip-api.com/json/?fields=status,lat,lon,city,regionName,zip');
      
      if (response.statusCode == 200 && response.data['status'] == 'success') {
        final data = response.data;
        final lat = (data['lat'] as num).toDouble();
        final lng = (data['lon'] as num).toDouble();
        
        _currentPosition = Position(
          latitude: lat,
          longitude: lng,
          timestamp: DateTime.now(),
          accuracy: 5000,
          altitude: 0,
          altitudeAccuracy: 0,
          heading: 0,
          headingAccuracy: 0,
          speed: 0,
          speedAccuracy: 0,
        );
        
        final city = data['city'] ?? '';
        final region = data['regionName'] ?? '';
        _zipCode = data['zip'];
        
        if (city.isNotEmpty && region.isNotEmpty) {
          _currentAddress = '$city, $region';
        } else if (city.isNotEmpty) {
          _currentAddress = city;
        } else {
          _currentAddress = 'Your Location';
        }
        
        _isIPLocation = true;
        _error = null;
        
        await _cacheLocation(lat, lng, _currentAddress!, true);
        
        _safeNotify();
        return true;
      }
      
      return await _tryFallbackIPService();
    } catch (e) {
      return await _tryFallbackIPService();
    }
  }
  
  Future<bool> _tryFallbackIPService() async {
    try {
      final dio = Dio();
      dio.options.connectTimeout = const Duration(seconds: 10);
      dio.options.receiveTimeout = const Duration(seconds: 10);
      
      final response = await dio.get('https://ipapi.co/json/');
      
      if (response.statusCode == 200) {
        final data = response.data;
        final lat = (data['latitude'] as num?)?.toDouble();
        final lng = (data['longitude'] as num?)?.toDouble();
        
        if (lat != null && lng != null) {
          _currentPosition = Position(
            latitude: lat,
            longitude: lng,
            timestamp: DateTime.now(),
            accuracy: 5000,
            altitude: 0,
            altitudeAccuracy: 0,
            heading: 0,
            headingAccuracy: 0,
            speed: 0,
            speedAccuracy: 0,
          );
          
          final city = data['city'] ?? '';
          final region = data['region'] ?? '';
          _zipCode = data['postal'];
          
          if (city.isNotEmpty && region.isNotEmpty) {
            _currentAddress = '$city, $region';
          } else if (city.isNotEmpty) {
            _currentAddress = city;
          } else {
            _currentAddress = 'Your Location';
          }
          
          _isIPLocation = true;
          _error = null;
          
          await _cacheLocation(lat, lng, _currentAddress!, true);
          
          _safeNotify();
          return true;
        }
      }
      
      _error = 'Unable to determine location';
      _safeNotify();
      return false;
    } catch (e) {
      _error = 'Unable to determine location';
      _safeNotify();
      return false;
    }
  }
  
  Future<void> _cacheLocation(double lat, double lng, String address, bool isIP) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheData = {
        'lat': lat,
        'lng': lng,
        'address': address,
        'isIP': isIP,
        'savedAt': DateTime.now().millisecondsSinceEpoch,
      };
      await prefs.setString(_locationCacheKey, jsonEncode(cacheData));
    } catch (_) {}
  }
  
  Future<Map<String, dynamic>?> _loadCachedLocation() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString(_locationCacheKey);
      
      if (cached != null) {
        final data = jsonDecode(cached) as Map<String, dynamic>;
        final savedAt = data['savedAt'] as int;
        final now = DateTime.now().millisecondsSinceEpoch;
        final hoursDiff = (now - savedAt) / (1000 * 60 * 60);
        
        if (hoursDiff < _cacheValidityHours) {
          return data;
        }
      }
    } catch (_) {}
    return null;
  }
  
  Future<bool> checkPermission() async {
    developer.log('[LocationProvider] checkPermission() called');
    
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    developer.log('[LocationProvider] Location services enabled: $serviceEnabled');
    
    if (!serviceEnabled) {
      _error = 'Location services are disabled. Please enable in Settings.';
      _safeNotify();
      developer.log('[LocationProvider] Opening location settings...');
      await Geolocator.openLocationSettings();
      return false;
    }
    
    LocationPermission permission = await Geolocator.checkPermission();
    developer.log('[LocationProvider] Current permission status: $permission');
    
    if (permission == LocationPermission.deniedForever) {
      _error = 'Location access is blocked. Tap "Use Current Location" again to open Settings.';
      _permissionDeniedForever = true;
      _safeNotify();
      return false;
    }
    
    if (permission == LocationPermission.denied) {
      developer.log('[LocationProvider] Requesting permission...');
      permission = await Geolocator.requestPermission();
      developer.log('[LocationProvider] Permission after request: $permission');
      
      if (permission == LocationPermission.denied) {
        _error = 'Location permission denied. Please try again.';
        _safeNotify();
        return false;
      }
      if (permission == LocationPermission.deniedForever) {
        _error = 'Location access is blocked. Tap "Use Current Location" again to open Settings.';
        _permissionDeniedForever = true;
        _safeNotify();
        return false;
      }
    }
    
    _permissionGranted = true;
    _permissionDeniedForever = false;
    _error = null;
    _safeNotify();
    return true;
  }
  
  bool get isPermissionDeniedForever => _permissionDeniedForever;
  
  Future<void> openAppSettings() async {
    developer.log('[LocationProvider] Opening app settings...');
    await Geolocator.openAppSettings();
  }
  
  Future<bool> getCurrentLocation() async {
    developer.log('[LocationProvider] getCurrentLocation() called');
    _isLoading = true;
    _error = null;
    _immediateNotify();
    
    try {
      developer.log('[LocationProvider] Checking location permission...');
      final hasPermission = await checkPermission();
      if (!hasPermission) {
        developer.log('[LocationProvider] Permission denied: $_error');
        _isLoading = false;
        _safeNotify();
        return false;
      }
      
      developer.log('[LocationProvider] Permission granted, getting GPS position...');
      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 15),
      );
      
      developer.log('[LocationProvider] Got position: ${_currentPosition?.latitude}, ${_currentPosition?.longitude}');
      
      await _reverseGeocode();
      developer.log('[LocationProvider] Reverse geocoded address: $_currentAddress');
      
      _isIPLocation = false;
      _isLoading = false;
      
      final pos = _currentPosition;
      if (pos != null) {
        await _cacheLocation(
          pos.latitude,
          pos.longitude,
          _currentAddress ?? 'Your Location',
          false,
        );
      }
      
      _safeNotify();
      developer.log('[LocationProvider] getCurrentLocation() success');
      return true;
    } catch (e) {
      developer.log('[LocationProvider] getCurrentLocation() error: $e');
      _error = _parseLocationError(e);
      developer.log('[LocationProvider] Parsed error: $_error');
      _isLoading = false;
      _safeNotify();
      return false;
    }
  }
  
  Future<bool> upgradeToGPS() async {
    return await getCurrentLocation();
  }
  
  Future<void> _reverseGeocode() async {
    final pos = _currentPosition;
    if (pos == null) return;
    
    try {
      final placemarks = await placemarkFromCoordinates(
        pos.latitude,
        pos.longitude,
      );
      
      if (placemarks.isNotEmpty) {
        final place = placemarks.first;
        _zipCode = place.postalCode;
        _currentAddress = _formatAddress(place);
      }
    } catch (e) {
      _currentAddress = '${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)}';
    }
  }
  
  String _formatAddress(Placemark place) {
    final parts = <String>[];
    
    if (place.street != null && place.street!.isNotEmpty) {
      parts.add(place.street!);
    }
    if (place.locality != null && place.locality!.isNotEmpty) {
      parts.add(place.locality!);
    }
    if (place.administrativeArea != null && place.administrativeArea!.isNotEmpty) {
      parts.add(place.administrativeArea!);
    }
    if (place.postalCode != null && place.postalCode!.isNotEmpty) {
      parts.add(place.postalCode!);
    }
    
    return parts.join(', ');
  }
  
  Future<String?> getAddressFromCoordinates(double lat, double lng) async {
    try {
      final placemarks = await placemarkFromCoordinates(lat, lng);
      if (placemarks.isNotEmpty) {
        return _formatAddress(placemarks.first);
      }
    } catch (_) {}
    return null;
  }
  
  Future<Map<String, double>?> getCoordinatesFromAddress(String address) async {
    try {
      final locations = await locationFromAddress(address);
      if (locations.isNotEmpty) {
        return {
          'latitude': locations.first.latitude,
          'longitude': locations.first.longitude,
        };
      }
    } catch (_) {}
    return null;
  }
  
  double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    return Geolocator.distanceBetween(lat1, lon1, lat2, lon2) / 1609.34;
  }
  
  String _parseLocationError(dynamic e) {
    final message = e.toString().toLowerCase();
    
    if (message.contains('permission')) {
      return 'Location permission denied';
    } else if (message.contains('service')) {
      return 'Location services are disabled';
    } else if (message.contains('timeout')) {
      return 'Location request timed out';
    }
    
    return 'Unable to get your location';
  }
  
  void setLocation({
    required double latitude,
    required double longitude,
    String? address,
    String? zip,
  }) {
    _currentPosition = Position(
      latitude: latitude,
      longitude: longitude,
      timestamp: DateTime.now(),
      accuracy: 0,
      altitude: 0,
      altitudeAccuracy: 0,
      heading: 0,
      headingAccuracy: 0,
      speed: 0,
      speedAccuracy: 0,
    );
    _currentAddress = address;
    _zipCode = zip;
    _isIPLocation = false;
    _safeNotify();
  }
  
  void clearLocation() {
    _currentPosition = null;
    _currentAddress = null;
    _zipCode = null;
    _error = null;
    _isIPLocation = false;
    _safeNotify();
  }
  
  void clearError() {
    _error = null;
    _immediateNotify();
  }
  
  Future<void> clearCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_locationCacheKey);
    } catch (_) {}
  }
}
