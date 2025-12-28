import 'user.dart';

class Item {
  final String id;
  final String title;
  final String description;
  final List<String> images;
  final String category;
  final List<String> tags;
  final int quantity;
  final String unit;
  final DateTime expiryDate;
  final bool isFree;
  final double? price;
  final String status;
  final String? address;
  final double? latitude;
  final double? longitude;
  final String? zipCode;
  final double? distance;
  final String? pickupTimeStart;
  final String? pickupTimeEnd;
  final List<String>? pickupDays;
  final bool isStoreItem;
  final int? stockQuantity;
  final bool offersDelivery;
  final double? deliveryFee;
  final DateTime? validUntil;
  final User? owner;
  final String ownerId;
  final DateTime createdAt;
  final DateTime updatedAt;

  Item({
    required this.id,
    required this.title,
    required this.description,
    required this.images,
    required this.category,
    this.tags = const [],
    required this.quantity,
    this.unit = 'items',
    required this.expiryDate,
    this.isFree = true,
    this.price,
    this.status = 'available',
    this.address,
    this.latitude,
    this.longitude,
    this.zipCode,
    this.distance,
    this.pickupTimeStart,
    this.pickupTimeEnd,
    this.pickupDays,
    this.isStoreItem = false,
    this.stockQuantity,
    this.offersDelivery = false,
    this.deliveryFee,
    this.validUntil,
    this.owner,
    required this.ownerId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Item.fromJson(Map<String, dynamic> json) {
    final ownerData = json['owner'] ?? json['user'];
    
    double? parseLat() {
      if (json['latitude'] != null) return json['latitude']?.toDouble();
      final location = json['location'];
      if (location is Map && location['coordinates'] is List) {
        final coords = location['coordinates'] as List;
        if (coords.length >= 2 && coords[1] is num) {
          return (coords[1] as num).toDouble();
        }
      }
      return null;
    }
    
    double? parseLng() {
      if (json['longitude'] != null) return json['longitude']?.toDouble();
      final location = json['location'];
      if (location is Map && location['coordinates'] is List) {
        final coords = location['coordinates'] as List;
        if (coords.isNotEmpty && coords[0] is num) {
          return (coords[0] as num).toDouble();
        }
      }
      return null;
    }
    
    return Item(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      images: List<String>.from(json['images'] ?? []),
      category: json['category'] ?? 'Other',
      tags: List<String>.from(json['tags'] ?? []),
      quantity: json['quantity'] ?? 1,
      unit: json['unit'] ?? 'items',
      expiryDate: DateTime.parse(json['expiryDate'] ?? DateTime.now().toIso8601String()),
      isFree: json['isFree'] ?? true,
      price: json['price']?.toDouble(),
      status: json['status'] ?? 'available',
      address: json['address'],
      latitude: parseLat(),
      longitude: parseLng(),
      zipCode: json['zipCode'],
      distance: json['distance']?.toDouble(),
      pickupTimeStart: json['pickupTimeStart'],
      pickupTimeEnd: json['pickupTimeEnd'],
      pickupDays: json['pickupDays'] != null 
          ? List<String>.from(json['pickupDays']) 
          : null,
      isStoreItem: json['isStoreItem'] ?? false,
      stockQuantity: json['stockQuantity'],
      offersDelivery: json['offersDelivery'] ?? false,
      deliveryFee: json['deliveryFee']?.toDouble(),
      validUntil: json['validUntil'] != null 
          ? DateTime.parse(json['validUntil']) 
          : null,
      owner: ownerData != null ? User.fromJson(ownerData) : null,
      ownerId: ownerData?['_id'] ?? ownerData?['id'] ?? json['ownerId'] ?? json['userId'] ?? '',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      'description': description,
      'images': images,
      'category': category,
      'tags': tags,
      'quantity': quantity,
      'unit': unit,
      'expiryDate': expiryDate.toIso8601String(),
      'isFree': isFree,
      'price': price,
      'status': status,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'zipCode': zipCode,
      'pickupTimeStart': pickupTimeStart,
      'pickupTimeEnd': pickupTimeEnd,
      'pickupDays': pickupDays,
      'isStoreItem': isStoreItem,
      'stockQuantity': stockQuantity,
      'offersDelivery': offersDelivery,
      'deliveryFee': deliveryFee,
      'validUntil': validUntil?.toIso8601String(),
      'ownerId': ownerId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isAvailable => status == 'available';
  bool get isPaid => !isFree && price != null && price! > 0;
  bool get isExpired => expiryDate.isBefore(DateTime.now());
  bool get hasValidityPeriod => validUntil != null;
  bool get isValidityExpired => validUntil != null && validUntil!.isBefore(DateTime.now());

  String get priceDisplay {
    if (isFree) return 'Free';
    if (price == null) return 'Free';
    return '\$${price!.toStringAsFixed(2)}';
  }

  String get distanceDisplay {
    if (distance == null) return '';
    if (distance! < 1) {
      return '${(distance! * 5280).round()} ft away';
    }
    return '${distance!.toStringAsFixed(1)} mi away';
  }
}
