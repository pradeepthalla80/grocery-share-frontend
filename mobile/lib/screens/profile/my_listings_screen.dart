import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/routes.dart';
import '../../providers/items_provider.dart';
import '../../widgets/items/item_card.dart';
import '../../widgets/common/empty_state.dart';

class MyListingsScreen extends StatefulWidget {
  const MyListingsScreen({super.key});

  @override
  State<MyListingsScreen> createState() => _MyListingsScreenState();
}

class _MyListingsScreenState extends State<MyListingsScreen> {
  @override
  void initState() {
    super.initState();
    context.read<ItemsProvider>().fetchMyItems();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Listings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => Navigator.pushNamed(context, AppRoutes.addItem),
          ),
        ],
      ),
      body: Consumer<ItemsProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.myItems.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.myItems.isEmpty) {
            return EmptyState(
              icon: Icons.shopping_basket_outlined,
              title: 'No Listings Yet',
              message: 'Share your surplus groceries with your community.',
              actionLabel: 'Add Item',
              onAction: () => Navigator.pushNamed(context, AppRoutes.addItem),
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.fetchMyItems(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.myItems.length,
              itemBuilder: (context, index) {
                final item = provider.myItems[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: ItemCard(
                    item: item,
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        AppRoutes.itemDetail,
                        arguments: {'itemId': item.id},
                      );
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
