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

class _SellerOnboardingScreenState extends State<SellerOnboardingScreen> {
  final PaymentService _paymentService = PaymentService();
  StripeAccountResult? _accountStatus;
  bool _isLoading = true;
  String _selectedCountry = 'US';

  @override
  void initState() {
    super.initState();
    _loadAccountStatus();
  }

  Future<void> _loadAccountStatus() async {
    setState(() => _isLoading = true);
    _accountStatus = await _paymentService.getStripeAccountStatus();
    setState(() => _isLoading = false);
  }

  Future<void> _createAccount() async {
    setState(() => _isLoading = true);

    final result = await _paymentService.createStripeAccount(_selectedCountry);

    setState(() => _isLoading = false);

    if (result.success && result.onboardingUrl != null) {
      final uri = Uri.parse(result.onboardingUrl!);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
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

    await _loadAccountStatus();
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Seller Payments'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: hasAccount
                          ? AppColors.success.withOpacity(0.1)
                          : AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: hasAccount ? AppColors.success : AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            hasAccount ? Icons.check : Icons.payments,
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
                                hasAccount
                                    ? 'Stripe Connected'
                                    : 'Set Up Payments',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                hasAccount
                                    ? 'You can receive payments for sold items'
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
                    _buildStepItem(1, 'Select your country'),
                    _buildStepItem(2, 'Complete Stripe onboarding'),
                    _buildStepItem(3, 'Start selling and receive payments'),
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
                      items: PaymentService.supportedCountries.map((country) {
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
                      isLoading: _isLoading,
                      label: 'Set Up Stripe Account',
                      icon: Icons.open_in_new,
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
                                _accountStatus!.status ?? 'Active',
                                _accountStatus!.status == 'active'
                                    ? AppColors.success
                                    : AppColors.warning,
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
                      onPressed: _loadAccountStatus,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Refresh Status'),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildStepItem(int number, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: const BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$number',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(text),
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
