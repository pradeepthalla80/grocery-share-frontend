import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notifications_provider.dart';
import '../../providers/chat_provider.dart';
import '../../providers/location_provider.dart';
import '../../widgets/common/app_drawer.dart';
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
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<Widget> _screens = [
    const ItemsScreen(),
    const RequestsScreen(),
    const ConversationsScreen(),
    const ProfileScreen(),
  ];

  final List<String> _titles = [
    'BaskMate',
    'Requests',
    'Messages',
    'Profile',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeLocation();
    });
  }

  Future<void> _initializeLocation() async {
    if (!mounted) return;
    
    final locationProvider = context.read<LocationProvider>();
    
    if (!locationProvider.hasLocation && !locationProvider.isLoading) {
      await locationProvider.initializeLocation();
    }
  }

  void _onNavigate(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: Text(_titles[_currentIndex]),
        automaticallyImplyLeading: false,
        actions: [
          if (_currentIndex == 0) ...[
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: () => Navigator.pushNamed(context, AppRoutes.notifications),
            ),
          ],
          if (_currentIndex == 3) ...[
            IconButton(
              icon: const Icon(Icons.settings_outlined),
              onPressed: () => Navigator.pushNamed(context, AppRoutes.settings),
            ),
          ],
          Builder(
            builder: (context) => IconButton(
              icon: Consumer2<NotificationsProvider, ChatProvider>(
                builder: (context, notifications, chat, _) {
                  final totalBadge = notifications.unreadCount + chat.unreadCount;
                  return Badge(
                    isLabelVisible: totalBadge > 0,
                    label: Text('$totalBadge'),
                    child: const Icon(Icons.menu),
                  );
                },
              ),
              onPressed: () => Scaffold.of(context).openEndDrawer(),
            ),
          ),
        ],
      ),
      endDrawer: AppDrawer(
        currentIndex: _currentIndex,
        onNavigate: _onNavigate,
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
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
