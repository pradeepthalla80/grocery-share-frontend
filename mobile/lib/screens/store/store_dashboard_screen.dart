import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/items_provider.dart';
import '../../services/payment_service.dart';

class StoreDashboardScreen extends StatefulWidget {
  const StoreDashboardScreen({super.key});

  @override
  State<StoreDashboardScreen> createState() => _StoreDashboardScreenState();
}

class _StoreDashboardScreenState extends State<StoreDashboardScreen> {
  final PaymentService _paymentService = PaymentService();
  StripeBalanceResult? _balance;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    context.read<ItemsProvider>().fetchMyItems();
    _balance = await _paymentService.getStripeBalance();

    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(
        title: Text(user?.storeName ?? 'Store Dashboard'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_balance != null && _balance!.success) ...[
                      Row(
                        children: [
                          Expanded(
                            child: _buildStatCard(
                              'Available',
                              '\$${_balance!.availableBalance.toStringAsFixed(2)}',
                              Icons.account_balance_wallet,
                              AppColors.success,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildStatCard(
                              'Pending',
                              '\$${_balance!.pendingBalance.toStringAsFixed(2)}',
                              Icons.pending,
                              AppColors.warning,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                    ],

                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.payment, color: AppColors.primary),
                        title: const Text('Manage Payments'),
                        subtitle: const Text('View Stripe dashboard'),
                        trailing: const Icon(Icons.open_in_new),
                        onTap: () async {
                          final url = await _paymentService.getStripeDashboardUrl();
                          if (url != null) {
                          }
                        },
                      ),
                    ),
                    const SizedBox(height: 24),

                    const Text(
                      'Store Items',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),

                    Consumer<ItemsProvider>(
                      builder: (context, provider, _) {
                        final storeItems = provider.myItems
                            .where((i) => i.isStoreItem)
                            .toList();

                        if (storeItems.isEmpty) {
                          return Card(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                children: [
                                  const Icon(
                                    Icons.store,
                                    size: 48,
                                    color: AppColors.textMuted,
                                  ),
                                  const SizedBox(height: 12),
                                  const Text(
                                    'No store items yet',
                                    style: TextStyle(color: AppColors.textSecondary),
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton(
                                    onPressed: () {
                                      Navigator.pushNamed(context, AppRoutes.addItem);
                                    },
                                    child: const Text('Add Store Item'),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }

                        return Column(
                          children: storeItems.map((item) {
                            return Card(
                              child: ListTile(
                                title: Text(item.title),
                                subtitle: Text(
                                  '${item.priceDisplay} • ${item.stockQuantity ?? item.quantity} in stock',
                                ),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  Navigator.pushNamed(
                                    context,
                                    AppRoutes.itemDetail,
                                    arguments: {'itemId': item.id},
                                  );
                                },
                              ),
                            );
                          }).toList(),
                        );
                      },
                    ),
                    const SizedBox(height: 24),

                    OutlinedButton.icon(
                      onPressed: () async {
                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Deactivate Store'),
                            content: const Text(
                              'Are you sure you want to deactivate your store? Your store items will be hidden.',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text('Cancel'),
                              ),
                              TextButton(
                                onPressed: () => Navigator.pop(context, true),
                                style: TextButton.styleFrom(
                                  foregroundColor: AppColors.error,
                                ),
                                child: const Text('Deactivate'),
                              ),
                            ],
                          ),
                        );

                        if (confirm == true && context.mounted) {
                          await context.read<AuthProvider>().deactivateStoreMode();
                          Navigator.pop(context);
                        }
                      },
                      icon: const Icon(Icons.store_outlined),
                      label: const Text('Deactivate Store'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
