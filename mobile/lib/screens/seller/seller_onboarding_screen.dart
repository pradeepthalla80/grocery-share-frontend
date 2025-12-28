import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/payment_service.dart';
import '../../widgets/common/loading_button.dart';

class SellerOnboardingScreen extends StatefulWidget {
  const SellerOnboardingScreen({super.key});

  @override
  State<SellerOnboardingScreen> createState() => _SellerOnboardingScreenState();
}

class _SellerOnboardingScreenState extends State<SellerOnboardingScreen> with WidgetsBindingObserver {
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

  Future<void> _createAccount() async {
    setState(() => _isCreatingAccount = true);

    final result = await _paymentService.createStripeAccount(_selectedCountry);

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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.error ?? 'Failed to create Stripe account'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _refreshOnboarding() async {
    setState(() => _isCreatingAccount = true);
    
    final url = await _paymentService.refreshOnboardingUrl();
    
    if (!mounted) return;
    setState(() => _isCreatingAccount = false);
    
    if (url != null) {
      _waitingForStripeReturn = true;
      final uri = Uri.parse(url);
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
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
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
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: accountActive 
                                  ? AppColors.success 
                                  : hasAccount 
                                      ? AppColors.warning 
                                      : AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              accountActive 
                                  ? Icons.check 
                                  : hasAccount 
                                      ? Icons.pending 
                                      : Icons.payments,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  accountActive
                                      ? 'Stripe Connected'
                                      : hasAccount 
                                          ? 'Setup Incomplete'
                                          : 'Set Up Payments',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  accountActive
                                      ? 'You can receive payments for sold items'
                                      : hasAccount 
                                          ? 'Complete your Stripe onboarding to start selling'
                                          : 'Connect Stripe to sell items and receive payments',
                                  style: const TextStyle(
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    if (!hasAccount) ...[
                      const Text(
                        'How it works',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildStepItem(1, 'Select your country', true),
                      _buildStepItem(2, 'Complete Stripe onboarding', false),
                      _buildStepItem(3, 'Start selling and receive payments', false),
                      const SizedBox(height: 24),

                      const Text(
                        'Select Country',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: _selectedCountry,
                        decoration: const InputDecoration(
                          labelText: 'Country',
                        ),
                        dropdownColor: AppColors.surface,
                        style: TextStyle(color: AppColors.textPrimary, fontSize: 16),
                        items: PaymentService.supportedCountries.map((country) {
                          return DropdownMenuItem(
                            value: country['code'],
                            child: Text(
                              country['name']!,
                              style: TextStyle(color: AppColors.textPrimary),
                            ),
                          );
                        }).toList(),
                        onChanged: (value) {
                          if (value != null) {
                            setState(() => _selectedCountry = value);
                          }
                        },
                      ),
                      const SizedBox(height: 24),

                      const Card(
                        child: Padding(
                          padding: EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.info_outline, color: AppColors.info),
                                  SizedBox(width: 8),
                                  Text(
                                    'Platform Fee',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 8),
                              Text(
                                'BaskMate charges a 10% platform fee on each sale. '
                                'The remaining 90% is deposited directly to your bank account.',
                                style: TextStyle(color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      LoadingButton(
                        onPressed: _createAccount,
                        isLoading: _isCreatingAccount,
                        label: 'Set Up Stripe Account',
                        icon: Icons.open_in_new,
                      ),
                    ] else if (!accountActive) ...[
                      const Card(
                        color: Color(0xFFFEF3C7),
                        child: Padding(
                          padding: EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.warning_amber, color: AppColors.warning),
                                  SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Complete Your Setup',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Your Stripe account is created but setup is incomplete. '
                                'Please complete the onboarding to start receiving payments.',
                                style: TextStyle(color: AppColors.textPrimary),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      LoadingButton(
                        onPressed: _refreshOnboarding,
                        isLoading: _isCreatingAccount,
                        label: 'Complete Stripe Setup',
                        icon: Icons.open_in_new,
                      ),
                      const SizedBox(height: 12),
                      Center(
                        child: TextButton.icon(
                          onPressed: () async {
                            await _loadAccountStatus();
                            await auth.refreshUser();
                          },
                          icon: const Icon(Icons.refresh),
                          label: const Text('Refresh Status'),
                        ),
                      ),
                    ] else ...[
                      if (_accountStatus?.success == true) ...[
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              children: [
                                _buildStatusRow(
                                  'Account Status',
                                  _accountStatus!.status?.toUpperCase() ?? 'Active',
                                  AppColors.success,
                                ),
                                const Divider(height: 24),
                                _buildStatusRow(
                                  'Charges Enabled',
                                  _accountStatus!.chargesEnabled ? 'Yes' : 'No',
                                  _accountStatus!.chargesEnabled
                                      ? AppColors.success
                                      : AppColors.error,
                                ),
                                const Divider(height: 24),
                                _buildStatusRow(
                                  'Payouts Enabled',
                                  _accountStatus!.payoutsEnabled ? 'Yes' : 'No',
                                  _accountStatus!.payoutsEnabled
                                      ? AppColors.success
                                      : AppColors.error,
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      ElevatedButton.icon(
                        onPressed: _openDashboard,
                        icon: const Icon(Icons.dashboard),
                        label: const Text('Open Stripe Dashboard'),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () async {
                          await _loadAccountStatus();
                          await auth.refreshUser();
                        },
                        icon: const Icon(Icons.refresh),
                        label: const Text('Refresh Status'),
                      ),
                    ],
                    
                    const SizedBox(height: 32),
                    if (_waitingForStripeReturn)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.info.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.info.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            const SizedBox(width: 16),
                            const Expanded(
                              child: Text(
                                'Complete your setup in the browser, then return here.',
                                style: TextStyle(color: AppColors.textSecondary),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStepItem(int number, String text, bool isActive) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: isActive ? AppColors.primary : AppColors.divider,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$number',
                style: TextStyle(
                  color: isActive ? Colors.white : AppColors.textMuted,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            text,
            style: TextStyle(
              color: isActive ? AppColors.textPrimary : AppColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusRow(String label, String value, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textSecondary)),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}
