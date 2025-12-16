import 'user.dart';

class Rating {
  final String id;
  final User? rater;
  final String raterId;
  final User? ratee;
  final String rateeId;
  final String? itemId;
  final String? pickupRequestId;
  final int rating;
  final String? comment;
  final DateTime createdAt;

  Rating({
    required this.id,
    this.rater,
    required this.raterId,
    this.ratee,
    required this.rateeId,
    this.itemId,
    this.pickupRequestId,
    required this.rating,
    this.comment,
    required this.createdAt,
  });

  factory Rating.fromJson(Map<String, dynamic> json) {
    return Rating(
      id: json['_id'] ?? json['id'] ?? '',
      rater: json['rater'] != null ? User.fromJson(json['rater']) : null,
      raterId: json['rater']?['_id'] ?? json['raterId'] ?? '',
      ratee: json['ratee'] != null ? User.fromJson(json['ratee']) : null,
      rateeId: json['ratee']?['_id'] ?? json['rateeId'] ?? '',
      itemId: json['itemId'],
      pickupRequestId: json['pickupRequestId'],
      rating: json['rating'] ?? 0,
      comment: json['comment'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'raterId': raterId,
      'rateeId': rateeId,
      'itemId': itemId,
      'pickupRequestId': pickupRequestId,
      'rating': rating,
      'comment': comment,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
