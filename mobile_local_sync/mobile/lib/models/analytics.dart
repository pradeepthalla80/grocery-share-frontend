class AnalyticsData {
  final int totalMembers;
  final int itemsShared;
  final int requestsFulfilled;
  final double foodSavedLbs;
  final int activeCommunities;
  final int openRequests;

  AnalyticsData({
    required this.totalMembers,
    required this.itemsShared,
    required this.requestsFulfilled,
    required this.foodSavedLbs,
    required this.activeCommunities,
    required this.openRequests,
  });

  factory AnalyticsData.fromJson(Map<String, dynamic> json) {
    return AnalyticsData(
      totalMembers: json['totalMembers'] ?? 0,
      itemsShared: json['itemsShared'] ?? 0,
      requestsFulfilled: json['requestsFulfilled'] ?? 0,
      foodSavedLbs: (json['foodSavedLbs'] ?? 0).toDouble(),
      activeCommunities: json['activeCommunities'] ?? 0,
      openRequests: json['openRequests'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalMembers': totalMembers,
      'itemsShared': itemsShared,
      'requestsFulfilled': requestsFulfilled,
      'foodSavedLbs': foodSavedLbs,
      'activeCommunities': activeCommunities,
      'openRequests': openRequests,
    };
  }
}
