import 'package:flutter/material.dart';

import '../../config/theme.dart';

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy Policy'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Privacy Policy',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Last Updated: December 16, 2025',
              style: TextStyle(color: AppColors.textMuted),
            ),
            const SizedBox(height: 24),

            _buildSection(
              '1. Data We Collect',
              '• Name, email, login credentials (hashed)\n'
              '• Location (zip code, optional address)\n'
              '• Listings, messages, ratings\n'
              '• Store terms acceptance, timestamps, IP address\n'
              '• Transaction metadata (no card details)',
            ),
            _buildSection(
              '2. How We Use Data',
              '• Operate the platform\n'
              '• Enable communication and payments\n'
              '• Prevent fraud and abuse\n'
              '• Improve service quality',
            ),
            _buildSection(
              '3. Data Visibility',
              '• Address shared only after mutual consent\n'
              '• Admin access limited to support and compliance',
            ),
            _buildSection(
              '4. Payments',
              'Payments are handled by Stripe. Grocery Share does not store payment card data.',
            ),
            _buildSection(
              '5. Data Retention',
              'Some records (transactions, consent logs) may be retained for legal and compliance purposes even after account deletion.',
            ),
            _buildSection(
              '6. Third Parties',
              'We use:\n'
              '• Stripe (payments)\n'
              '• Google Maps (location)\n'
              '• Cloud services (hosting)\n\n'
              'Each has its own privacy policy.',
            ),
            _buildSection(
              '7. Security',
              '• HTTPS enforced\n'
              '• Encrypted authentication\n'
              '• Industry-standard protections',
            ),
            _buildSection(
              '8. Policy Updates',
              'Major changes will be communicated via app or email.',
            ),
            _buildSection(
              '9. Contact',
              'privacy@groceryshare.app',
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: const TextStyle(
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
