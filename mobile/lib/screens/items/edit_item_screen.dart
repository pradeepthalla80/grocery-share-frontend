import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/items_provider.dart';

class EditItemScreen extends StatefulWidget {
  final String itemId;

  const EditItemScreen({super.key, required this.itemId});

  @override
  State<EditItemScreen> createState() => _EditItemScreenState();
}

class _EditItemScreenState extends State<EditItemScreen> {
  @override
  void initState() {
    super.initState();
    context.read<ItemsProvider>().fetchItem(widget.itemId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Item'),
      ),
      body: Consumer<ItemsProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final item = provider.currentItem;
          if (item == null) {
            return const Center(child: Text('Item not found'));
          }

          return const Center(
            child: Text('Edit form implementation'),
          );
        },
      ),
    );
  }
}
