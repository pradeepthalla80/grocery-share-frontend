import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import 'config/app_config.dart';
import 'config/theme.dart';
import 'config/routes.dart';
import 'providers/auth_provider.dart';
import 'providers/items_provider.dart';
import 'providers/requests_provider.dart';
import 'providers/chat_provider.dart';
import 'providers/notifications_provider.dart';
import 'providers/location_provider.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  SystemChrome.setSystemUIOverlayStyle(
  const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ),
);
  if (!kIsWeb &&
      AppConfig.stripePublishableKey.isNotEmpty &&
      AppConfig.stripePublishableKey.startsWith('pk_')) {
    Stripe.publishableKey = AppConfig.stripePublishableKey;
    await Stripe.instance.applySettings();
  }
  
  runApp(const BaskMateApp());
}

class BaskMateApp extends StatelessWidget {
  const BaskMateApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => LocationProvider()),
        ChangeNotifierProxyProvider<AuthProvider, ItemsProvider>(
          create: (_) => ItemsProvider(),
          update: (_, auth, items) => items!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, RequestsProvider>(
          create: (_) => RequestsProvider(),
          update: (_, auth, requests) => requests!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, ChatProvider>(
          create: (_) => ChatProvider(),
          update: (_, auth, chat) => chat!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, NotificationsProvider>(
          create: (_) => NotificationsProvider(),
          update: (_, auth, notifications) => notifications!..updateAuth(auth),
        ),
      ],
      child: MaterialApp(
        title: 'BaskMate',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.light,
        home: const SplashScreen(),
        onGenerateRoute: AppRoutes.generateRoute,
      ),
    );
  }
}
