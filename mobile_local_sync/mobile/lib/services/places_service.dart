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
    final structuredFormatting =
        json['structured_formatting'] as Map<String, dynamic>? ?? {};
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
  late final String _apiKey;

  PlacesService() {
    _apiKey = const String.fromEnvironment('GOOGLE_PLACES_API_KEY');
    developer.log(
      '[PlacesService] API key loaded: ${_apiKey.isNotEmpty ? 'YES' : 'NO'}',
    );
  }

  bool get isConfigured => _apiKey.isNotEmpty;

  // ===============================
  // AUTOCOMPLETE
  // ===============================
  Future<List<PlacePrediction>> getAutocompletePredictions(String input) async {
    if (input.length < 3 || _apiKey.isEmpty) return [];

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
      developer.log('[PlacesService] Autocomplete status: $status');

      if (status == 'OK') {
        return (response.data['predictions'] as List<dynamic>)
            .map((p) => PlacePrediction.fromJson(p))
            .toList();
      }

      return [];
    } catch (e) {
      developer.log('[PlacesService] Autocomplete error: $e');
      return [];
    }
  }

  // ===============================
  // PLACE DETAILS
  // ===============================
  Future<PlaceDetails?> getPlaceDetails(String placeId) async {
    if (_apiKey.isEmpty) return null;

    try {
      developer.log('[PlacesService] Fetching details for: $placeId');

      final response = await _dio.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        queryParameters: {
          'place_id': placeId,
          'key': _apiKey,
          'fields': 'formatted_address,geometry,address_components',
        },
      );

      if (response.data['status'] != 'OK') return null;

      final result = response.data['result'];
      final location = result['geometry']['location'];

      String? zipCode;
      for (final c in result['address_components']) {
        if ((c['types'] as List).contains('postal_code')) {
          zipCode = c['long_name'];
          break;
        }
      }

      return PlaceDetails(
        formattedAddress: result['formatted_address'],
        latitude: (location['lat'] as num).toDouble(),
        longitude: (location['lng'] as num).toDouble(),
        zipCode: zipCode,
      );
    } catch (e) {
      developer.log('[PlacesService] Place details error: $e');
      return null;
    }
  }

  // ===============================
  // FALLBACK GEOCODING
  // ===============================
  Future<PlaceDetails?> geocodeAddress(String address) async {
    if (address.isEmpty) return null;

    try {
      final locations = await locationFromAddress(address);
      if (locations.isEmpty) return null;

      final loc = locations.first;
      String? zip;

      try {
        final placemarks =
            await placemarkFromCoordinates(loc.latitude, loc.longitude);
        if (placemarks.isNotEmpty) {
          zip = placemarks.first.postalCode;
        }
      } catch (_) {}

      return PlaceDetails(
        formattedAddress: address,
        latitude: loc.latitude,
        longitude: loc.longitude,
        zipCode: zip,
      );
    } catch (e) {
      developer.log('[PlacesService] Geocode error: $e');
      return null;
    }
  }
}
