import 'dart:developer' as developer;
import 'package:dio/dio.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import 'api_client.dart';

class PaymentService {
  final ApiClient _api = ApiClient();

  // ============================================================
  // BUYER FLOW — PAYMENTS
  // ============================================================

  Future<PaymentResult> createPaymentIntent({
    required String itemId,
    required double amount,
    int quantity = 1,
    bool includeDelivery = false,
  }) async {
    try {
      final amountInCents = (amount * 100).round();

      developer.log('[PaymentService] createPaymentIntent: $amountInCents');

      final response = await _api.post('/payments/create-intent', data: {
        'itemId': itemId,
        'amount': amountInCents,
        'quantity': quantity,
        'includeDelivery': includeDelivery,
      });

      return PaymentResult(
        success: true,
        clientSecret: response.data['clientSecret'],
        paymentIntentId: response.data['paymentIntentId'],
      );
    } catch (e) {
      developer.log('[PaymentService] Payment intent error: $e');
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

      developer.log('[PaymentService] Payment confirmed');
      return true;
    } catch (e) {
      developer.log('[PaymentService] Confirm payment error: $e');
      return false;
    }
  }

  // ============================================================
  // SELLER FLOW — STRIPE CONNECT (MOBILE ONLY)
  // ============================================================

  /// ✅ THIS IS THE ONLY ONBOARDING METHOD MOBILE MUST USE
  /// Backend: POST /api/v1/stripe-connect/mobile-onboarding
  ///
  /// Returns:
  /// { success: true, url: "https://connect.stripe.com/..." }

  Future<StripeAccountResult> startMobileStripeOnboarding({
    String country = 'US',
  }) async {
    try {
      developer.log('[PaymentService] Starting mobile Stripe onboarding');

      final response =
          await _api.post('/stripe-connect/mobile-onboarding', data: {
        'country': country,
      });

      developer.log('[PaymentService] Mobile onboarding response: ${response.data}');

      final onboardingUrl = response.data['url']?.toString();

      if (onboardingUrl == null || onboardingUrl.isEmpty) {
        return StripeAccountResult(
          success: false,
          error: 'Stripe onboarding link not returned by server',
        );
      }

      return StripeAccountResult(
        success: true,
        onboardingUrl: onboardingUrl,
      );
    } catch (e) {
      developer.log('[PaymentService] Mobile onboarding error: $e');
      return StripeAccountResult(success: false, error: _parseError(e));
    }
  }

  // ============================================================
  // SELLER STATUS
  // ============================================================

  Future<StripeAccountResult> getStripeAccountStatus() async {
    try {
      final response = await _api.get('/stripe-connect/account-status');

      final data = response.data;

      return StripeAccountResult(
        success: true,
        accountId: data['accountId']?.toString(),
        status: data['accountStatus']?['status']?.toString(),
        payoutsEnabled: data['accountStatus']?['payoutsEnabled'] == true,
        chargesEnabled: data['accountStatus']?['chargesEnabled'] == true,
      );
    } catch (e) {
      developer.log('[PaymentService] Account status error: $e');
      return StripeAccountResult(success: false, error: _parseError(e));
    }
  }

  Future<String?> getStripeDashboardUrl() async {
    try {
      final response = await _api.post('/stripe-connect/dashboard-link');
      return response.data['url']?.toString();
    } catch (e) {
      developer.log('[PaymentService] Dashboard link error: $e');
      return null;
    }
  }

  Future<StripeBalanceResult> getStripeBalance() async {
    try {
      final response = await _api.get('/stripe-connect/balance');

      return StripeBalanceResult(
        success: true,
        availableBalance:
            (response.data['balance']['available'] ?? 0).toDouble(),
        pendingBalance:
            (response.data['balance']['pending'] ?? 0).toDouble(),
        currency: response.data['balance']['currency'] ?? 'usd',
      );
    } catch (e) {
      developer.log('[PaymentService] Balance error: $e');
      return StripeBalanceResult(success: false, error: _parseError(e));
    }
  }

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  String _parseError(dynamic e) {
    if (e is DioException) {
      final data = e.response?.data;

      if (data is Map) {
        return data['error'] ??
            data['message'] ??
            data['msg'] ??
            'Server error';
      }

      if (data is String) {
        return data;
      }

      if (e.response?.statusCode == 401) {
        return 'Session expired. Please login again.';
      }
    }

    return 'An error occurred. Please try again.';
  }
}

// ============================================================
// MODELS
// ============================================================

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
