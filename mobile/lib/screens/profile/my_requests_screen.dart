import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/routes.dart';
import '../../providers/requests_provider.dart';
import '../../widgets/requests/request_card.dart';
import '../../widgets/common/empty_state.dart';

class MyRequestsScreen extends StatefulWidget {
  const MyRequestsScreen({super.key});

  @override
  State<MyRequestsScreen> createState() => _MyRequestsScreenState();
}

class _MyRequestsScreenState extends State<MyRequestsScreen> {
  @override
  void initState() {
    super.initState();
    context.read<RequestsProvider>().fetchMyRequests();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Requests'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => Navigator.pushNamed(context, AppRoutes.addRequest),
          ),
        ],
      ),
      body: Consumer<RequestsProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.myRequests.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.myRequests.isEmpty) {
            return EmptyState(
              icon: Icons.list_alt_outlined,
              title: 'No Requests Yet',
              message: 'Post a request for items you need from your community.',
              actionLabel: 'Post Request',
              onAction: () => Navigator.pushNamed(context, AppRoutes.addRequest),
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.fetchMyRequests(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.myRequests.length,
              itemBuilder: (context, index) {
                final request = provider.myRequests[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: RequestCard(
                    request: request,
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        AppRoutes.requestDetail,
                        arguments: {'requestId': request.id},
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
