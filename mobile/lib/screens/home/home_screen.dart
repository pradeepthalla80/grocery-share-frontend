import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/items_provider.dart';
import '../../providers/notifications_provider.dart';
import '../../providers/chat_provider.dart';
import '../../providers/location_provider.dart';
import '../items/items_screen.dart';
import '../requests/requests_screen.dart';
import '../chat/conversations_screen.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const ItemsScreen(),
    const RequestsScreen(),
    const ConversationsScreen(),
    const ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    final locationProvider = context.read<LocationProvider>();
    await locationProvider.getCurrentLocation();

    if (!mounted) return;

    final itemsProvider = context.read<ItemsProvider>();
    itemsProvider.fetchItems(
      latitude: locationProvider.latitude,
      longitude: locationProvider.longitude,
    );
    itemsProvider.fetchRecommendations(
      latitude: locationProvider.latitude,
      longitude: locationProvider.longitude,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Consumer3<NotificationsProvider, ChatProvider, AuthProvider>(
        builder: (context, notifications, chat, auth, _) {
          return BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            items: [
              const BottomNavigationBarItem(
                icon: Icon(Icons.home_outlined),
                activeIcon: Icon(Icons.home),
                label: 'Home',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.list_alt_outlined),
                activeIcon: Icon(Icons.list_alt),
                label: 'Requests',
              ),
              BottomNavigationBarItem(
                icon: Badge(
                  isLabelVisible: chat.unreadCount > 0,
                  label: Text('${chat.unreadCount}'),
                  child: const Icon(Icons.chat_bubble_outline),
                ),
                activeIcon: Badge(
                  isLabelVisible: chat.unreadCount > 0,
                  label: Text('${chat.unreadCount}'),
                  child: const Icon(Icons.chat_bubble),
                ),
                label: 'Chat',
              ),
              BottomNavigationBarItem(
                icon: Badge(
                  isLabelVisible: notifications.unreadCount > 0,
                  label: Text('${notifications.unreadCount}'),
                  child: const Icon(Icons.person_outline),
                ),
                activeIcon: Badge(
                  isLabelVisible: notifications.unreadCount > 0,
                  label: Text('${notifications.unreadCount}'),
                  child: const Icon(Icons.person),
                ),
                label: 'Profile',
              ),
            ],
          );
        },
      ),
      floatingActionButton: _currentIndex == 0 || _currentIndex == 1
          ? FloatingActionButton(
              onPressed: () {
                if (_currentIndex == 0) {
                  Navigator.pushNamed(context, AppRoutes.addItem);
                } else {
                  Navigator.pushNamed(context, AppRoutes.addRequest);
                }
              },
              backgroundColor: AppColors.primary,
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
    );
  }
}
