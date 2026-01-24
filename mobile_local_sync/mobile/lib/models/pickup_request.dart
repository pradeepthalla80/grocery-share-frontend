import 'user.dart';
import 'item.dart';

class PickupRequest {
  final String id;
  final Item? item;
  final String itemId;
  final User? buyer;
  final String buyerId;
  final User? seller;
  final String sellerId;
  final String message;
  final int quantity;
  final String status;
  final bool addressRevealed;
  final String? revealedAddress;
  final DateTime? scheduledPickupTime;
  final DateTime? completedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  PickupRequest({
    required this.id,
    this.item,
    required this.itemId,
    this.buyer,
    required this.buyerId,
    this.seller,
    required this.sellerId,
    this.message = '',
    this.quantity = 1,
    this.status = 'pending',
    this.addressRevealed = false,
    this.revealedAddress,
    this.scheduledPickupTime,
    this.completedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory PickupRequest.fromJson(Map<String, dynamic> json) {
    return PickupRequest(
      id: json['_id'] ?? json['id'] ?? '',
      item: json['item'] != null ? Item.fromJson(json['item']) : null,
      itemId: json['item']?['_id'] ?? json['itemId'] ?? '',
      buyer: json['buyer'] != null ? User.fromJson(json['buyer']) : null,
      buyerId: json['buyer']?['_id'] ?? json['buyerId'] ?? '',
      seller: json['seller'] != null ? User.fromJson(json['seller']) : null,
      sellerId: json['seller']?['_id'] ?? json['sellerId'] ?? '',
      message: json['message'] ?? '',
      quantity: json['quantity'] ?? 1,
      status: json['status'] ?? 'pending',
      addressRevealed: json['addressRevealed'] ?? false,
      revealedAddress: json['revealedAddress'],
      scheduledPickupTime: json['scheduledPickupTime'] != null
          ? DateTime.parse(json['scheduledPickupTime'])
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'])
          : null,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'itemId': itemId,
      'buyerId': buyerId,
      'sellerId': sellerId,
      'message': message,
      'quantity': quantity,
      'status': status,
      'addressRevealed': addressRevealed,
      'revealedAddress': revealedAddress,
      'scheduledPickupTime': scheduledPickupTime?.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isPending => status == 'pending';
  bool get isAccepted => status == 'accepted' || status == 'awaiting_pickup';
  bool get isAwaitingPickup => status == 'awaiting_pickup';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get isDeclined => status == 'declined';

  String get statusDisplay {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'awaiting_pickup':
        return 'Ready for Pickup';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'declined':
        return 'Declined';
      default:
        return status;
    }
  }
}
