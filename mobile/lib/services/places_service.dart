import 'dart:developer' as developer;
import 'package:geocoding/geocoding.dart';

class PlacePrediction {
  final String placeId;
  final String description;
  final String mainText;
  final String secondaryText;

  PlacePrediction({
    required this.placeId,
    required this.description,
    required this.mainText,
    required this.secondaryText,
  });
}

class PlaceDetails {
  final String formattedAddress;
  final double latitude;
  final double longitude;
  final String? zipCode;

  PlaceDetails({
    required this.formattedAddress,
    required this.latitude,
    required this.longitude,
    this.zipCode,
  });
}

class PlacesService {
  Future<List<PlacePrediction>> getAutocompletePredictions(String input) async {
    developer.log('[PlacesService] Address autocomplete called with: $input');
    developer.log('[PlacesService] Note: Google Places API not available on mobile');
    developer.log('[PlacesService] Users should use "Use Current Location" button instead');
    return [];
  }

  Future<PlaceDetails?> getPlaceDetails(String placeId) async {
    developer.log('[PlacesService] Place details called for: $placeId');
    return null;
  }
  
  Future<PlaceDetails?> geocodeAddress(String address) async {
    if (address.isEmpty) return null;
    
    try {
      developer.log('[PlacesService] Geocoding address: $address');
      
      final locations = await locationFromAddress(address);
      
      if (locations.isNotEmpty) {
        final location = locations.first;
        developer.log('[PlacesService] Geocoded to: ${location.latitude}, ${location.longitude}');
        
        String? zipCode;
        try {
          final placemarks = await placemarkFromCoordinates(
            location.latitude,
            location.longitude,
          );
          if (placemarks.isNotEmpty) {
            zipCode = placemarks.first.postalCode;
          }
        } catch (_) {}
        
        return PlaceDetails(
          formattedAddress: address,
          latitude: location.latitude,
          longitude: location.longitude,
          zipCode: zipCode,
        );
      }
      
      developer.log('[PlacesService] No locations found for address');
      return null;
    } catch (e) {
      developer.log('[PlacesService] Geocoding error: $e');
      return null;
    }
  }
  
  bool get isConfigured => true;
}
