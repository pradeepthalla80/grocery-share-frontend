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
      await Stripe.instance.confirmPayment(
        paymentIntentClientSecret: clientSecret,
        data: const PaymentMethodParams.card(
          paymentMethodData: PaymentMethodData(),
        ),
      );
      return true;
    } catch (e) {
      return false;
    }
  }
  
  Future<StripeAccountResult> createStripeAccount(String country) async {
    try {
      developer.log('[PaymentService] createStripeAccount called with country: $country');
      final response = await _api.post('/stripe-connect/create-account', data: {
        'country': country,
      });
      
      final accountId = response.data['accountId'];
      final hasOnboardingUrl = response.data['onboardingUrl'] != null;
      developer.log('[PaymentService] Create account success: accountId=$accountId, hasOnboardingUrl=$hasOnboardingUrl');
      
      return StripeAccountResult(
        success: true,
        accountId: accountId,
        onboardingUrl: response.data['onboardingUrl'],
      );
    } catch (e) {
      developer.log('[PaymentService] createStripeAccount error: $e');
      if (e is DioException) {
        developer.log('[PaymentService] Response status: ${e.response?.statusCode}');
        final errorData = e.response?.data;
        if (errorData is Map) {
          developer.log('[PaymentService] Error message: ${errorData['message'] ?? errorData['error']}');
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
      
      return StripeAccountResult(
        success: true,
        accountId: response.data['accountId'],
        status: response.data['status'],
        payoutsEnabled: response.data['payoutsEnabled'] ?? false,
        chargesEnabled: response.data['chargesEnabled'] ?? false,
      );
    } catch (e) {
      developer.log('[PaymentService] getStripeAccountStatus error: $e');
      return StripeAccountResult(success: false, error: _parseError(e));
    }
  }
  
  Future<String?> getStripeDashboardUrl() async {
    try {
      final response = await _api.get('/stripe-connect/dashboard-link');
      return response.data['url'];
    } catch (_) {
      return null;
    }
  }
  
  Future<StripeBalanceResult> getStripeBalance() async {
    try {
      final response = await _api.get('/stripe-connect/balance');
      
      return StripeBalanceResult(
        success: true,
        availableBalance: (response.data['available'] ?? 0).toDouble(),
        pendingBalance: (response.data['pending'] ?? 0).toDouble(),
        currency: response.data['currency'] ?? 'usd',
      );
    } catch (e) {
      return StripeBalanceResult(success: false, error: _parseError(e));
    }
  }
  
  Future<String?> refreshOnboardingUrl() async {
    try {
      developer.log('[PaymentService] refreshOnboardingUrl called');
      final response = await _api.post('/stripe-connect/refresh-onboarding');
      final hasUrl = response.data['onboardingUrl'] != null;
      developer.log('[PaymentService] Refresh onboarding success: hasUrl=$hasUrl');
      return response.data['onboardingUrl'];
    } catch (e) {
      developer.log('[PaymentService] refreshOnboardingUrl error: $e');
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
      if (data is Map && data['message'] != null) {
        return data['message'];
      }
    }
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
