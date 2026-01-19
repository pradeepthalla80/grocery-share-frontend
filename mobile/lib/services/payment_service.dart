import 'dart:developer' as developer;
import 'package:dio/dio.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import 'api_client.dart';

class PaymentService {
  final ApiClient _api = ApiClient();
  
  Future<PaymentResult> createPaymentIntent({
    required String itemId,
    required double amount,
    int quantity = 1,
    bool includeDelivery = false,
  }) async {
    try {
      final amountInCents = (amount * 100).round();
      developer.log('[PaymentService] createPaymentIntent: itemId=$itemId, amount=$amount, amountInCents=$amountInCents');
      
      final response = await _api.post('/payments/create-intent', data: {
        'itemId': itemId,
        'amount': amountInCents,
        'quantity': quantity,
        'includeDelivery': includeDelivery,
      });
      
      developer.log('[PaymentService] Payment intent created: ${response.data}');
      
      return PaymentResult(
        success: true,
        clientSecret: response.data['clientSecret'],
        paymentIntentId: response.data['paymentIntentId'],
      );
    } catch (e) {
      developer.log('[PaymentService] ERROR creating payment intent: $e');
      if (e is DioException) {
        developer.log('[PaymentService] Response status: ${e.response?.statusCode}');
        developer.log('[PaymentService] Response data: ${e.response?.data}');
      }
      return PaymentResult(success: false, error: _parseError(e));
    }
  }
  
  Future<bool> confirmPayment(String clientSecret) async {
    try {
      developer.log('[PaymentService] confirmPayment called');
      await Stripe.instance.confirmPayment(
        paymentIntentClientSecret: clientSecret,
        data: const PaymentMethodParams.card(
          paymentMethodData: PaymentMethodData(),
        ),
      );
      developer.log('[PaymentService] Payment confirmed successfully');
      return true;
    } catch (e) {
      developer.log('[PaymentService] ERROR confirming payment: $e');
      return false;
    }
  }
  
  Future<StripeAccountResult> createStripeAccount(String country) async {
    try {
      developer.log('[PaymentService] createStripeAccount called with country: $country');
      final response = await _api.post('/stripe-connect/create-account', data: {
        'country': country,
      });
      
      developer.log('[PaymentService] Raw response: ${response.data}');
      developer.log('[PaymentService] Response type: ${response.data.runtimeType}');
      
      final data = response.data;
      String? accountId;
      String? onboardingUrl;
      
      if (data is Map) {
        accountId = data['accountId']?.toString();
        onboardingUrl = data['onboardingUrl']?.toString() ?? data['url']?.toString();
        developer.log('[PaymentService] Parsed accountId: $accountId');
        developer.log('[PaymentService] Parsed onboardingUrl: $onboardingUrl');
      }
      
      if (accountId == null) {
        developer.log('[PaymentService] ERROR: No accountId in response');
        return StripeAccountResult(
          success: false,
          error: 'No account ID returned from server',
        );
      }
      
      return StripeAccountResult(
        success: true,
        accountId: accountId,
        onboardingUrl: onboardingUrl,
      );
    } catch (e) {
      developer.log('[PaymentService] createStripeAccount error: $e');
      if (e is DioException) {
        developer.log('[PaymentService] Response status: ${e.response?.statusCode}');
        developer.log('[PaymentService] Response headers: ${e.response?.headers}');
        final errorData = e.response?.data;
        developer.log('[PaymentService] Response data: $errorData');
        developer.log('[PaymentService] Response data type: ${errorData.runtimeType}');
        
        if (errorData is Map) {
          final errorMsg = errorData['message'] ?? errorData['error'] ?? errorData['msg'];
          developer.log('[PaymentService] Parsed error message: $errorMsg');
        }
      }
      return StripeAccountResult(success: false, error: _parseError(e));
    }
  }
  
  Future<StripeAccountResult> getStripeAccountStatus() async {
    try {
      developer.log('[PaymentService] getStripeAccountStatus called');
      final response = await _api.get('/stripe-connect/account-status');
      
      developer.log('[PaymentService] Account status response: ${response.data}');
      
      final data = response.data;
      return StripeAccountResult(
        success: true,
        accountId: data['accountId']?.toString(),
        status: data['status']?.toString(),
        payoutsEnabled: data['payoutsEnabled'] == true,
        chargesEnabled: data['chargesEnabled'] == true,
      );
    } catch (e) {
      developer.log('[PaymentService] getStripeAccountStatus error: $e');
      if (e is DioException) {
        developer.log('[PaymentService] Status response code: ${e.response?.statusCode}');
        developer.log('[PaymentService] Status response data: ${e.response?.data}');
      }
      return StripeAccountResult(success: false, error: _parseError(e));
    }
  }
  
  Future<String?> getStripeDashboardUrl() async {
    try {
      developer.log('[PaymentService] getStripeDashboardUrl called');
      final response = await _api.get('/stripe-connect/dashboard-link');
      final url = response.data['url']?.toString();
      developer.log('[PaymentService] Dashboard URL: $url');
      return url;
    } catch (e) {
      developer.log('[PaymentService] getStripeDashboardUrl error: $e');
      return null;
    }
  }
  
  Future<StripeBalanceResult> getStripeBalance() async {
    try {
      developer.log('[PaymentService] getStripeBalance called');
      final response = await _api.get('/stripe-connect/balance');
      
      developer.log('[PaymentService] Balance response: ${response.data}');
      
      return StripeBalanceResult(
        success: true,
        availableBalance: (response.data['available'] ?? 0).toDouble(),
        pendingBalance: (response.data['pending'] ?? 0).toDouble(),
        currency: response.data['currency'] ?? 'usd',
      );
    } catch (e) {
      developer.log('[PaymentService] getStripeBalance error: $e');
      return StripeBalanceResult(success: false, error: _parseError(e));
    }
  }
  
  Future<String?> refreshOnboardingUrl() async {
    try {
      developer.log('[PaymentService] refreshOnboardingUrl called');
      final response = await _api.post('/stripe-connect/refresh-onboarding');
      
      developer.log('[PaymentService] Refresh response: ${response.data}');
      
      final data = response.data;
      String? url;
      if (data is Map) {
        url = data['onboardingUrl']?.toString() ?? data['url']?.toString();
      }
      
      developer.log('[PaymentService] Refresh onboarding URL: $url');
      return url;
    } catch (e) {
      developer.log('[PaymentService] refreshOnboardingUrl error: $e');
      if (e is DioException) {
        developer.log('[PaymentService] Refresh error status: ${e.response?.statusCode}');
        developer.log('[PaymentService] Refresh error data: ${e.response?.data}');
      }
      return null;
    }
  }
  
  static const List<Map<String, String>> supportedCountries = [
    {'code': 'US', 'name': 'United States'},
    {'code': 'GB', 'name': 'United Kingdom'},
    {'code': 'CA', 'name': 'Canada'},
    {'code': 'AU', 'name': 'Australia'},
    {'code': 'DE', 'name': 'Germany'},
    {'code': 'FR', 'name': 'France'},
    {'code': 'IT', 'name': 'Italy'},
    {'code': 'ES', 'name': 'Spain'},
    {'code': 'NL', 'name': 'Netherlands'},
    {'code': 'BE', 'name': 'Belgium'},
    {'code': 'AT', 'name': 'Austria'},
    {'code': 'CH', 'name': 'Switzerland'},
    {'code': 'IE', 'name': 'Ireland'},
    {'code': 'PT', 'name': 'Portugal'},
    {'code': 'SE', 'name': 'Sweden'},
    {'code': 'DK', 'name': 'Denmark'},
    {'code': 'NO', 'name': 'Norway'},
    {'code': 'FI', 'name': 'Finland'},
    {'code': 'PL', 'name': 'Poland'},
    {'code': 'CZ', 'name': 'Czech Republic'},
    {'code': 'HU', 'name': 'Hungary'},
    {'code': 'RO', 'name': 'Romania'},
    {'code': 'BG', 'name': 'Bulgaria'},
    {'code': 'HR', 'name': 'Croatia'},
    {'code': 'SK', 'name': 'Slovakia'},
    {'code': 'SI', 'name': 'Slovenia'},
    {'code': 'LT', 'name': 'Lithuania'},
    {'code': 'LV', 'name': 'Latvia'},
    {'code': 'EE', 'name': 'Estonia'},
    {'code': 'MT', 'name': 'Malta'},
    {'code': 'CY', 'name': 'Cyprus'},
    {'code': 'LU', 'name': 'Luxembourg'},
    {'code': 'JP', 'name': 'Japan'},
    {'code': 'SG', 'name': 'Singapore'},
    {'code': 'HK', 'name': 'Hong Kong'},
    {'code': 'NZ', 'name': 'New Zealand'},
    {'code': 'MX', 'name': 'Mexico'},
    {'code': 'BR', 'name': 'Brazil'},
    {'code': 'MY', 'name': 'Malaysia'},
    {'code': 'TH', 'name': 'Thailand'},
  ];
  
  String _parseError(dynamic e) {
    if (e is DioException && e.response?.data != null) {
      final data = e.response?.data;
      if (data is Map) {
        final message = data['message'] ?? data['error'] ?? data['msg'];
        if (message != null) {
          developer.log('[PaymentService] Parsed error: $message');
          return message.toString();
        }
      }
      if (data is String && data.isNotEmpty) {
        developer.log('[PaymentService] Parsed string error: $data');
        return data;
      }
    }
    developer.log('[PaymentService] Using default error message');
    return 'An error occurred. Please try again.';
  }
}

class PaymentResult {
  final bool success;
  final String? clientSecret;
  final String? paymentIntentId;
  final String? error;
  
  PaymentResult({
    required this.success,
    this.clientSecret,
    this.paymentIntentId,
    this.error,
  });
}

class StripeAccountResult {
  final bool success;
  final String? accountId;
  final String? status;
  final String? onboardingUrl;
  final bool payoutsEnabled;
  final bool chargesEnabled;
  final String? error;
  
  StripeAccountResult({
    required this.success,
    this.accountId,
    this.status,
    this.onboardingUrl,
    this.payoutsEnabled = false,
    this.chargesEnabled = false,
    this.error,
  });
}

class StripeBalanceResult {
  final bool success;
  final double availableBalance;
  final double pendingBalance;
  final String currency;
  final String? error;
  
  StripeBalanceResult({
    required this.success,
    this.availableBalance = 0,
    this.pendingBalance = 0,
    this.currency = 'usd',
    this.error,
  });
}
