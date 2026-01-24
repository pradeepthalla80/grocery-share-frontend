import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/requests_provider.dart';

class RequestDetailScreen extends StatefulWidget {
  final String requestId;

  const RequestDetailScreen({super.key, required this.requestId});

  @override
  State<RequestDetailScreen> createState() => _RequestDetailScreenState();
}

class _RequestDetailScreenState extends State<RequestDetailScreen> {
  @override
  void initState() {
    super.initState();
    context.read<RequestsProvider>().fetchRequest(widget.requestId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Request Details'),
      ),
      body: Consumer<RequestsProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final request = provider.currentRequest;
          if (request == null) {
            return const Center(child: Text('Request not found'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  request.title,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(request.description),
                const SizedBox(height: 16),
                Text('Category: ${request.category}'),
                Text('Quantity: ${request.quantity} ${request.unit}'),
                Text('Price Preference: ${request.pricePreferenceDisplay}'),
              ],
            ),
          );
        },
      ),
    );
  }
}
