import 'dart:developer' as developer;
import 'package:dio/dio.dart';
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

  factory PlacePrediction.fromJson(Map<String, dynamic> json) {
    final structuredFormatting = json['structured_formatting'] as Map<String, dynamic>? ?? {};
    return PlacePrediction(
      placeId: json['place_id'] ?? '',
      description: json['description'] ?? '',
      mainText: structuredFormatting['main_text'] ?? json['description'] ?? '',
      secondaryText: structuredFormatting['secondary_text'] ?? '',
    );
  }
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
  final Dio _dio = Dio();
  
  static const String _apiKey = String.fromEnvironment(
    'GOOGLE_PLACES_API_KEY',
    defaultValue: '',
  );

  bool get isConfigured => _apiKey.isNotEmpty;

  Future<List<PlacePrediction>> getAutocompletePredictions(String input) async {
    if (input.length < 3) return [];
    
    if (_apiKey.isEmpty) {
      developer.log('[PlacesService] WARNING: Google Places API key not configured');
      developer.log('[PlacesService] Pass --dart-define=GOOGLE_PLACES_API_KEY=your_key when building');
      return [];
    }
    
    try {
      developer.log('[PlacesService] Fetching predictions for: $input');
      
      final response = await _dio.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        queryParameters: {
          'input': input,
          'key': _apiKey,
          'types': 'address',
        },
      );
      
      final status = response.data['status'];
      developer.log('[PlacesService] Autocomplete response status: $status');
      
      if (status == 'OK') {
        final predictions = (response.data['predictions'] as List<dynamic>)
            .map((p) => PlacePrediction.fromJson(p as Map<String, dynamic>))
            .toList();
        developer.log('[PlacesService] Found ${predictions.length} predictions');
        return predictions;
      } else if (status == 'ZERO_RESULTS') {
        return [];
      } else {
        developer.log('[PlacesService] Autocomplete error: $status - ${response.data['error_message'] ?? 'unknown'}');
        return [];
      }
    } catch (e) {
      developer.log('[PlacesService] ERROR fetching predictions: $e');
      return [];
    }
  }

  Future<PlaceDetails?> getPlaceDetails(String placeId) async {
    if (_apiKey.isEmpty) {
      developer.log('[PlacesService] WARNING: Google Places API key not configured');
      return null;
    }
    
    try {
      developer.log('[PlacesService] Fetching place details for: $placeId');
      
      final response = await _dio.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        queryParameters: {
          'place_id': placeId,
          'key': _apiKey,
          'fields': 'formatted_address,geometry,address_components',
        },
      );
      
      final status = response.data['status'];
      developer.log('[PlacesService] Place details response status: $status');
      
      if (status == 'OK') {
        final result = response.data['result'] as Map<String, dynamic>;
        final geometry = result['geometry'] as Map<String, dynamic>;
        final location = geometry['location'] as Map<String, dynamic>;
        
        String? zipCode;
        final addressComponents = result['address_components'] as List<dynamic>?;
        if (addressComponents != null) {
          for (final component in addressComponents) {
            final types = (component['types'] as List<dynamic>).cast<String>();
            if (types.contains('postal_code')) {
              zipCode = component['long_name'] as String?;
              break;
            }
          }
        }
        
        final details = PlaceDetails(
          formattedAddress: result['formatted_address'] ?? '',
          latitude: (location['lat'] as num).toDouble(),
          longitude: (location['lng'] as num).toDouble(),
          zipCode: zipCode,
        );
        
        developer.log('[PlacesService] Place details: ${details.formattedAddress} (${details.latitude}, ${details.longitude})');
        return details;
      } else {
        developer.log('[PlacesService] Place details error: $status');
        return null;
      }
    } catch (e) {
      developer.log('[PlacesService] ERROR fetching place details: $e');
      return null;
    }
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
}
