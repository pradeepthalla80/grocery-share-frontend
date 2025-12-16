import 'user.dart';

class ItemRequest {
  final String id;
  final String title;
  final String description;
  final String category;
  final List<String> tags;
  final int quantity;
  final String unit;
  final String pricePreference;
  final double? maxPrice;
  final String? address;
  final double? latitude;
  final double? longitude;
  final String? zipCode;
  final double? distance;
  final String status;
  final DateTime validUntil;
  final User? requester;
  final String requesterId;
  final List<RequestOffer> offers;
  final DateTime createdAt;
  final DateTime updatedAt;

  ItemRequest({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    this.tags = const [],
    required this.quantity,
    this.unit = 'items',
    this.pricePreference = 'any',
    this.maxPrice,
    this.address,
    this.latitude,
    this.longitude,
    this.zipCode,
    this.distance,
    this.status = 'active',
    required this.validUntil,
    this.requester,
    required this.requesterId,
    this.offers = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory ItemRequest.fromJson(Map<String, dynamic> json) {
    return ItemRequest(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? 'Other',
      tags: List<String>.from(json['tags'] ?? []),
      quantity: json['quantity'] ?? 1,
      unit: json['unit'] ?? 'items',
      pricePreference: json['pricePreference'] ?? 'any',
      maxPrice: json['maxPrice']?.toDouble(),
      address: json['address'],
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
      zipCode: json['zipCode'],
      distance: json['distance']?.toDouble(),
      status: json['status'] ?? 'active',
      validUntil: DateTime.parse(json['validUntil'] ?? DateTime.now().add(const Duration(days: 7)).toIso8601String()),
      requester: json['requester'] != null ? User.fromJson(json['requester']) : null,
      requesterId: json['requester']?['_id'] ?? json['requesterId'] ?? '',
      offers: (json['offers'] as List<dynamic>?)
              ?.map((o) => RequestOffer.fromJson(o))
              .toList() ??
          [],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      'description': description,
      'category': category,
      'tags': tags,
      'quantity': quantity,
      'unit': unit,
      'pricePreference': pricePreference,
      'maxPrice': maxPrice,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'zipCode': zipCode,
      'status': status,
      'validUntil': validUntil.toIso8601String(),
      'requesterId': requesterId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isActive => status == 'active';
  bool get isExpired => validUntil.isBefore(DateTime.now());

  String get pricePreferenceDisplay {
    switch (pricePreference) {
      case 'free':
        return 'Free only';
      case 'paid':
        return 'Willing to pay';
      default:
        return 'Any';
    }
  }

  String get distanceDisplay {
    if (distance == null) return '';
    if (distance! < 1) {
      return '${(distance! * 5280).round()} ft away';
    }
    return '${distance!.toStringAsFixed(1)} mi away';
  }
}

class RequestOffer {
  final String id;
  final User? offerer;
  final String offererId;
  final String message;
  final bool isFree;
  final double? price;
  final bool offersDelivery;
  final double? deliveryFee;
  final String status;
  final DateTime createdAt;

  RequestOffer({
    required this.id,
    this.offerer,
    required this.offererId,
    required this.message,
    this.isFree = true,
    this.price,
    this.offersDelivery = false,
    this.deliveryFee,
    this.status = 'pending',
    required this.createdAt,
  });

  factory RequestOffer.fromJson(Map<String, dynamic> json) {
    return RequestOffer(
      id: json['_id'] ?? json['id'] ?? '',
      offerer: json['offerer'] != null ? User.fromJson(json['offerer']) : null,
      offererId: json['offerer']?['_id'] ?? json['offererId'] ?? '',
      message: json['message'] ?? '',
      isFree: json['isFree'] ?? true,
      price: json['price']?.toDouble(),
      offersDelivery: json['offersDelivery'] ?? false,
      deliveryFee: json['deliveryFee']?.toDouble(),
      status: json['status'] ?? 'pending',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'offererId': offererId,
      'message': message,
      'isFree': isFree,
      'price': price,
      'offersDelivery': offersDelivery,
      'deliveryFee': deliveryFee,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
