import '../models/analytics.dart';
import 'api_client.dart';

class AnalyticsService {
  final ApiClient _api = ApiClient();
  
  Future<AnalyticsResult> getCommunityImpact() async {
    try {
      final response = await _api.get('/analytics/community-impact');
      final data = AnalyticsData.fromJson(response.data);
      return AnalyticsResult(success: true, data: data);
    } catch (e) {
      final fallbackData = AnalyticsData(
        totalMembers: 0,
        itemsShared: 0,
        requestsFulfilled: 0,
        foodSavedLbs: 0,
        activeCommunities: 0,
        openRequests: 0,
      );
      return AnalyticsResult(success: true, data: fallbackData, isFallback: true);
    }
  }
}

class AnalyticsResult {
  final bool success;
  final AnalyticsData? data;
  final String? error;
  final bool isFallback;
  
  AnalyticsResult({
    required this.success,
    this.data,
    this.error,
    this.isFallback = false,
  });
}
