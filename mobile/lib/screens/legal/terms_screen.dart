import 'package:flutter/material.dart';

import '../../config/theme.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Terms of Use'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Terms of Use',
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
              '1. Platform Purpose',
              'Grocery Share is a peer-to-peer marketplace that enables users to list, request, share, or sell grocery items locally. We do not sell, inspect, store, or deliver items ourselves.',
            ),
            _buildSection(
              '2. Eligibility',
              '• You must be 18 years or older\n'
              '• You are responsible for ensuring your participation complies with local laws\n'
              '• Store owners are responsible for any permits or licenses required in their jurisdiction',
            ),
            _buildSection(
              '3. Listings & Requests',
              '• Only sealed, labeled, and unexpired items may be listed\n'
              '• Users must ensure accuracy of item descriptions, expiry dates, and pricing\n'
              '• Grocery Share may remove listings that violate guidelines\n'
              '• Store items may include pricing and stock quantity',
            ),
            _buildSection(
              '4. Store Owner Mode',
              '• Store owners operate as independent sellers\n'
              '• Grocery Share does not verify food quality, legality, or seller compliance\n'
              '• Store owners agree to separate Store Terms & Agreement\n'
              '• Acceptance of store terms is logged with timestamp and IP address',
            ),
            _buildSection(
              '5. Payments & Fees',
              '• Payments are processed via Stripe\n'
              '• Grocery Share does not store credit card information\n'
              '• A platform service fee may be deducted per transaction\n'
              '• Refunds and disputes are subject to seller policies and Stripe rules',
            ),
            _buildSection(
              '6. Pickup & Communication',
              '• Pickup is arranged directly between users\n'
              '• Addresses are shared only with mutual consent\n'
              '• Users are responsible for personal safety during exchanges',
            ),
            _buildSection(
              '7. No Guarantees & Food Disclaimer',
              '• Grocery Share makes no guarantees about item safety, quality, freshness, or legality\n'
              '• Users assume all risk associated with consuming or handling items\n'
              '• Grocery Share is not liable for illness, damage, or loss',
            ),
            _buildSection(
              '8. Reviews & Ratings',
              '• One rating per transaction\n'
              '• False or abusive reviews may be removed',
            ),
            _buildSection(
              '9. Account Suspension',
              'We may suspend or terminate accounts for:\n'
              '• Fraud\n'
              '• Abuse\n'
              '• Policy violations\n'
              '• Illegal activity',
            ),
            _buildSection(
              '10. Limitation of Liability',
              'To the maximum extent permitted by law, Grocery Share is not liable for:\n'
              '• Personal injury\n'
              '• Food-related illness\n'
              '• Financial loss\n'
              '• Disputes between users',
            ),
            _buildSection(
              '11. Indemnification',
              'You agree to indemnify and hold harmless Grocery Share and its owners from any claims arising from your use of the platform.',
            ),
            _buildSection(
              '12. Governing Law',
              'These Terms are governed by the laws of the State of Illinois, USA.',
            ),
            _buildSection(
              '13. Changes',
              'We may update these Terms. Continued use means acceptance.',
            ),
            _buildSection(
              '14. Contact',
              'support@groceryshare.app',
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
