import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

class LocationProvider with ChangeNotifier {
  Position? _currentPosition;
  String? _currentAddress;
  String? _zipCode;
  bool _isLoading = false;
  String? _error;
  bool _permissionGranted = false;
  bool _disposed = false;
  
  Position? get currentPosition => _currentPosition;
  String? get currentAddress => _currentAddress;
  String? get zipCode => _zipCode;
  double? get latitude => _currentPosition?.latitude;
  double? get longitude => _currentPosition?.longitude;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasLocation => _currentPosition != null;
  bool get permissionGranted => _permissionGranted;
  
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
  
  Future<bool> checkPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _error = 'Location services are disabled. Please enable in Settings.';
      _safeNotify();
      await Geolocator.openLocationSettings();
      return false;
    }
    
    LocationPermission permission = await Geolocator.checkPermission();
    
    if (permission == LocationPermission.deniedForever) {
      _error = 'Location permissions are permanently denied. Please enable in Settings.';
      _safeNotify();
      await Geolocator.openAppSettings();
      return false;
    }
    
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _error = 'Location permission denied. Please try again.';
        _safeNotify();
        return false;
      }
      if (permission == LocationPermission.deniedForever) {
        _error = 'Location permissions are permanently denied. Please enable in Settings.';
        _safeNotify();
        await Geolocator.openAppSettings();
        return false;
      }
    }
    
    _permissionGranted = true;
    _error = null;
    _safeNotify();
    return true;
  }
  
  Future<bool> getCurrentLocation() async {
    _isLoading = true;
    _error = null;
    _immediateNotify();
    
    try {
      final hasPermission = await checkPermission();
      if (!hasPermission) {
        _isLoading = false;
        _safeNotify();
        return false;
      }
      
      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 15),
      );
      
      await _reverseGeocode();
      
      _isLoading = false;
      _safeNotify();
      return true;
    } catch (e) {
      _error = _parseLocationError(e);
      _isLoading = false;
      _safeNotify();
      return false;
    }
  }
  
  Future<void> _reverseGeocode() async {
    if (_currentPosition == null) return;
    
    try {
      final placemarks = await placemarkFromCoordinates(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
      );
      
      if (placemarks.isNotEmpty) {
        final place = placemarks.first;
        _zipCode = place.postalCode;
        _currentAddress = _formatAddress(place);
      }
    } catch (e) {
      _currentAddress = '${_currentPosition!.latitude.toStringAsFixed(4)}, ${_currentPosition!.longitude.toStringAsFixed(4)}';
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
    _safeNotify();
  }
  
  void clearLocation() {
    _currentPosition = null;
    _currentAddress = null;
    _zipCode = null;
    _error = null;
    _safeNotify();
  }
  
  void clearError() {
    _error = null;
    _immediateNotify();
  }
}
