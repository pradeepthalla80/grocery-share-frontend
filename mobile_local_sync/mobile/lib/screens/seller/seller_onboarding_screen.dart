import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/payment_service.dart';
import '../../widgets/common/loading_button.dart';

/// ✅ Country list moved here (not in PaymentService)
const supportedCountries = [
  {'code': 'US', 'name': 'United States'},
  {'code': 'CA', 'name': 'Canada'},
  {'code': 'GB', 'name': 'United Kingdom'},
  {'code': 'AU', 'name': 'Australia'},
];

class SellerOnboardingScreen extends StatefulWidget {
  const SellerOnboardingScreen({super.key});

  @override
  State<SellerOnboardingScreen> createState() => _SellerOnboardingScreenState();
}

class _SellerOnboardingScreenState extends State<SellerOnboardingScreen>
    with WidgetsBindingObserver {
  final PaymentService _paymentService = PaymentService();

  StripeAccountResult? _accountStatus;
  bool _isLoading = true;
  bool _isCreatingAccount = false;
  String _selectedCountry = 'US';
  bool _waitingForStripeReturn = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadAccountStatus();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _waitingForStripeReturn) {
      _waitingForStripeReturn = false;
      _refreshAfterStripeReturn();
    }
  }

  Future<void> _refreshAfterStripeReturn() async {
    await _loadAccountStatus();
    await context.read<AuthProvider>().refreshUser();

    if (mounted && _accountStatus?.chargesEnabled == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Stripe account setup complete!'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  Future<void> _loadAccountStatus() async {
    setState(() => _isLoading = true);
    _accountStatus = await _paymentService.getStripeAccountStatus();
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  /// ✅ MOBILE ONBOARDING FLOW
  Future<void> _createAccount() async {
    setState(() => _isCreatingAccount = true);

    final result = await _paymentService.startMobileStripeOnboarding(
      country: _selectedCountry,
    );

    if (!mounted) return;

    setState(() => _isCreatingAccount = false);

    if (result.success && result.onboardingUrl != null) {
      _waitingForStripeReturn = true;

      final uri = Uri.parse(result.onboardingUrl!);
      final launched = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );

      if (!launched && mounted) {
        _waitingForStripeReturn = false;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not open Stripe onboarding. Please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.error ?? 'Failed to create Stripe account'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  /// ✅ FIXED — Refresh onboarding link
  Future<void> _refreshOnboarding() async {
    setState(() => _isCreatingAccount = true);

    final result = await _paymentService.startMobileStripeOnboarding(
      country: _selectedCountry,
    );

    if (!mounted) return;

    setState(() => _isCreatingAccount = false);

    if (result.success && result.onboardingUrl != null) {
      _waitingForStripeReturn = true;
      final uri = Uri.parse(result.onboardingUrl!);
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not get onboarding URL. Please try again.'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _openDashboard() async {
    final url = await _paymentService.getStripeDashboardUrl();
    if (url != null) {
      final uri = Uri.parse(url);
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final hasAccount = auth.hasStripeAccount;
    final accountActive = _accountStatus?.chargesEnabled == true;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Seller Payments'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                await _loadAccountStatus();
                await auth.refreshUser();
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    /// STATUS CARD
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: accountActive
                            ? AppColors.success.withOpacity(0.1)
                            : hasAccount
                                ? AppColors.warning.withOpacity(0.1)
                                : AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            accountActive
                                ? Icons.check_circle
                                : hasAccount
                                    ? Icons.pending
                                    : Icons.payments,
                            color: accountActive
                                ? AppColors.success
                                : hasAccount
                                    ? AppColors.warning
                                    : AppColors.primary,
                            size: 36,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(
                              accountActive
                                  ? 'Stripe Connected'
                                  : hasAccount
                                      ? 'Setup Incomplete'
                                      : 'Set Up Payments',
                              style: const TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    /// CREATE ACCOUNT
                    if (!hasAccount) ...[
                      DropdownButtonFormField<String>(
                        value: _selectedCountry,
                        decoration:
                            const InputDecoration(labelText: 'Country'),
                        items: supportedCountries.map((country) {
                          return DropdownMenuItem(
                            value: country['code'],
                            child: Text(country['name']!),
                          );
                        }).toList(),
                        onChanged: (value) {
                          if (value != null) {
                            setState(() => _selectedCountry = value);
                          }
                        },
                      ),
                      const SizedBox(height: 20),
                      LoadingButton(
                        onPressed: _createAccount,
                        isLoading: _isCreatingAccount,
                        label: 'Set Up Stripe Account',
                        icon: Icons.open_in_new,
                      ),
                    ]

                    /// INCOMPLETE
                    else if (!accountActive) ...[
                      LoadingButton(
                        onPressed: _refreshOnboarding,
                        isLoading: _isCreatingAccount,
                        label: 'Complete Stripe Setup',
                        icon: Icons.open_in_new,
                      ),
                    ]

                    /// ACTIVE
                    else ...[
                      ElevatedButton.icon(
                        onPressed: _openDashboard,
                        icon: const Icon(Icons.dashboard),
                        label: const Text('Open Stripe Dashboard'),
                      ),
                    ],

                    if (_waitingForStripeReturn) ...[
                      const SizedBox(height: 24),
                      const Center(
                        child: Text(
                          'Complete setup in browser then return here...',
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                      ),
                    ]
                  ],
                ),
              ),
            ),
    );
  }
}
