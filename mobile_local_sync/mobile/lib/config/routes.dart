import 'package:flutter/material.dart';

import '../screens/splash_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/items/items_screen.dart';
import '../screens/items/item_detail_screen.dart';
import '../screens/items/add_item_screen.dart';
import '../screens/items/edit_item_screen.dart';
import '../screens/requests/requests_screen.dart';
import '../screens/requests/request_detail_screen.dart';
import '../screens/requests/add_request_screen.dart';
import '../screens/chat/conversations_screen.dart';
import '../screens/chat/chat_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/profile/edit_profile_screen.dart';
import '../screens/profile/my_listings_screen.dart';
import '../screens/profile/my_requests_screen.dart';
import '../screens/store/store_dashboard_screen.dart';
import '../screens/store/store_onboarding_screen.dart';
import '../screens/seller/seller_onboarding_screen.dart';
import '../screens/analytics/analytics_screen.dart';
import '../screens/admin/admin_dashboard_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/legal/terms_screen.dart';
import '../screens/legal/privacy_screen.dart';

class AppRoutes {
  static const String splash = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String home = '/home';
  static const String items = '/items';
  static const String itemDetail = '/items/detail';
  static const String addItem = '/items/add';
  static const String editItem = '/items/edit';
  static const String requests = '/requests';
  static const String requestDetail = '/requests/detail';
  static const String addRequest = '/requests/add';
  static const String conversations = '/chat';
  static const String chat = '/chat/conversation';
  static const String notifications = '/notifications';
  static const String profile = '/profile';
  static const String editProfile = '/profile/edit';
  static const String myListings = '/profile/listings';
  static const String myRequests = '/profile/requests';
  static const String storeDashboard = '/store/dashboard';
  static const String storeOnboarding = '/store/onboarding';
  static const String sellerOnboarding = '/seller/onboarding';
  static const String analytics = '/analytics';
  static const String adminDashboard = '/admin';
  static const String settings = '/settings';
  static const String terms = '/terms';
  static const String privacy = '/privacy';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return _buildRoute(const SplashScreen(), settings);
      case login:
        return _buildRoute(const LoginScreen(), settings);
      case register:
        return _buildRoute(const RegisterScreen(), settings);
      case forgotPassword:
        return _buildRoute(const ForgotPasswordScreen(), settings);
      case home:
        return _buildRoute(const HomeScreen(), settings);
      case items:
        return _buildRoute(const ItemsScreen(), settings);
      case itemDetail:
        final args = settings.arguments as Map<String, dynamic>;
        return _buildRoute(ItemDetailScreen(itemId: args['itemId']), settings);
      case addItem:
        return _buildRoute(const AddItemScreen(), settings);
      case editItem:
        final args = settings.arguments as Map<String, dynamic>;
        return _buildRoute(EditItemScreen(itemId: args['itemId']), settings);
      case requests:
        return _buildRoute(const RequestsScreen(), settings);
      case requestDetail:
        final args = settings.arguments as Map<String, dynamic>;
        return _buildRoute(RequestDetailScreen(requestId: args['requestId']), settings);
      case addRequest:
        return _buildRoute(const AddRequestScreen(), settings);
      case conversations:
        return _buildRoute(const ConversationsScreen(), settings);
      case chat:
        final args = settings.arguments as Map<String, dynamic>;
        return _buildRoute(
          ChatScreen(
            conversationId: args['conversationId'],
            recipientId: args['recipientId'],
            recipientName: args['recipientName'],
            itemId: args['itemId'],
          ),
          settings,
        );
      case notifications:
        return _buildRoute(const NotificationsScreen(), settings);
      case profile:
        return _buildRoute(const ProfileScreen(), settings);
      case editProfile:
        return _buildRoute(const EditProfileScreen(), settings);
      case myListings:
        return _buildRoute(const MyListingsScreen(), settings);
      case myRequests:
        return _buildRoute(const MyRequestsScreen(), settings);
      case storeDashboard:
        return _buildRoute(const StoreDashboardScreen(), settings);
      case storeOnboarding:
        return _buildRoute(const StoreOnboardingScreen(), settings);
      case sellerOnboarding:
        return _buildRoute(const SellerOnboardingScreen(), settings);
      case analytics:
        return _buildRoute(const AnalyticsScreen(), settings);
      case adminDashboard:
        return _buildRoute(const AdminDashboardScreen(), settings);
      case AppRoutes.settings:
        return _buildRoute(const SettingsScreen(), settings);
      case terms:
        return _buildRoute(const TermsScreen(), settings);
      case privacy:
        return _buildRoute(const PrivacyScreen(), settings);
      default:
        return _buildRoute(const HomeScreen(), settings);
    }
  }

  static MaterialPageRoute _buildRoute(Widget page, RouteSettings settings) {
    return MaterialPageRoute(
      builder: (_) => page,
      settings: settings,
    );
  }
}
