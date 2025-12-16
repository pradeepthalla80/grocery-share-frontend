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
      return AnalyticsResult(success: false, error: e.toString());
    }
  }
}

class AnalyticsResult {
  final bool success;
  final AnalyticsData? data;
  final String? error;
  
  AnalyticsResult({
    required this.success,
    this.data,
    this.error,
  });
}
