class User {
  final String id;
  final String name;
  final String email;
  final String? profileImage;
  final String? phone;
  final String? zipCode;
  final String? address;
  final double? latitude;
  final double? longitude;
  final String role;
  final bool isStoreOwner;
  final String? storeName;
  final String? storeDescription;
  final bool hasAcceptedStoreTerms;
  final DateTime? storeTermsAcceptedAt;
  final String? stripeAccountId;
  final String? stripeAccountStatus;
  final double rating;
  final int totalRatings;
  final List<Badge> badges;
  final bool isVerified;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.profileImage,
    this.phone,
    this.zipCode,
    this.address,
    this.latitude,
    this.longitude,
    this.role = 'user',
    this.isStoreOwner = false,
    this.storeName,
    this.storeDescription,
    this.hasAcceptedStoreTerms = false,
    this.storeTermsAcceptedAt,
    this.stripeAccountId,
    this.stripeAccountStatus,
    this.rating = 0,
    this.totalRatings = 0,
    this.badges = const [],
    this.isVerified = false,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      profileImage: json['profileImage'],
      phone: json['phone'],
      zipCode: json['zipCode'],
      address: json['address'],
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
      role: json['role'] ?? 'user',
      isStoreOwner: json['isStoreOwner'] ?? false,
      storeName: json['storeName'],
      storeDescription: json['storeDescription'],
      hasAcceptedStoreTerms: json['hasAcceptedStoreTerms'] ?? false,
      storeTermsAcceptedAt: json['storeTermsAcceptedAt'] != null
          ? DateTime.parse(json['storeTermsAcceptedAt'])
          : null,
      stripeAccountId: json['stripeAccountId'],
      stripeAccountStatus: json['stripeAccountStatus'],
      rating: (json['rating'] ?? 0).toDouble(),
      totalRatings: json['totalRatings'] ?? 0,
      badges: (json['badges'] as List<dynamic>?)
              ?.map((b) => Badge.fromJson(b))
              .toList() ??
          [],
      isVerified: json['isVerified'] ?? false,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'profileImage': profileImage,
      'phone': phone,
      'zipCode': zipCode,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'role': role,
      'isStoreOwner': isStoreOwner,
      'storeName': storeName,
      'storeDescription': storeDescription,
      'hasAcceptedStoreTerms': hasAcceptedStoreTerms,
      'storeTermsAcceptedAt': storeTermsAcceptedAt?.toIso8601String(),
      'stripeAccountId': stripeAccountId,
      'stripeAccountStatus': stripeAccountStatus,
      'rating': rating,
      'totalRatings': totalRatings,
      'badges': badges.map((b) => b.toJson()).toList(),
      'isVerified': isVerified,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isAdmin => role == 'admin' || role == 'super_admin';
  bool get isSuperAdmin => role == 'super_admin';
  bool get hasStripeAccount => stripeAccountId != null && stripeAccountId!.isNotEmpty;
  bool get hasActiveStripeAccount => stripeAccountId != null && stripeAccountStatus == 'active';

  User copyWith({
    String? name,
    String? profileImage,
    String? phone,
    String? zipCode,
    String? address,
    double? latitude,
    double? longitude,
    bool? isStoreOwner,
    String? storeName,
    String? storeDescription,
    bool? hasAcceptedStoreTerms,
    DateTime? storeTermsAcceptedAt,
    String? stripeAccountId,
    String? stripeAccountStatus,
  }) {
    return User(
      id: id,
      name: name ?? this.name,
      email: email,
      profileImage: profileImage ?? this.profileImage,
      phone: phone ?? this.phone,
      zipCode: zipCode ?? this.zipCode,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      role: role,
      isStoreOwner: isStoreOwner ?? this.isStoreOwner,
      storeName: storeName ?? this.storeName,
      storeDescription: storeDescription ?? this.storeDescription,
      hasAcceptedStoreTerms: hasAcceptedStoreTerms ?? this.hasAcceptedStoreTerms,
      storeTermsAcceptedAt: storeTermsAcceptedAt ?? this.storeTermsAcceptedAt,
      stripeAccountId: stripeAccountId ?? this.stripeAccountId,
      stripeAccountStatus: stripeAccountStatus ?? this.stripeAccountStatus,
      rating: rating,
      totalRatings: totalRatings,
      badges: badges,
      isVerified: isVerified,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}

class Badge {
  final String id;
  final String name;
  final String icon;
  final String description;
  final DateTime earnedAt;

  Badge({
    required this.id,
    required this.name,
    required this.icon,
    required this.description,
    required this.earnedAt,
  });

  factory Badge.fromJson(Map<String, dynamic> json) {
    return Badge(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      icon: json['icon'] ?? '',
      description: json['description'] ?? '',
      earnedAt: DateTime.parse(json['earnedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'icon': icon,
      'description': description,
      'earnedAt': earnedAt.toIso8601String(),
    };
  }
}
