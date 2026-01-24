import 'dart:async';

import 'package:app_links/app_links.dart';
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

  // Stripe init
  if (!kIsWeb &&
      AppConfig.stripePublishableKey.isNotEmpty &&
      AppConfig.stripePublishableKey.startsWith('pk_')) {
    Stripe.publishableKey = AppConfig.stripePublishableKey;
    await Stripe.instance.applySettings();
  }

  runApp(const BaskMateApp());
}

class BaskMateApp extends StatefulWidget {
  const BaskMateApp({super.key});

  @override
  State<BaskMateApp> createState() => _BaskMateAppState();
}

class _BaskMateAppState extends State<BaskMateApp> {
  final AppLinks _appLinks = AppLinks();
  StreamSubscription<Uri>? _sub;

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  // =============================
  // STRIPE AUTO RETURN HANDLER
  // =============================

  Future<void> _initDeepLinks() async {
    if (kIsWeb) return;

    // ---------- Cold start ----------
    try {
      final Uri? initialUri = await _appLinks.getInitialAppLink();
      if (initialUri != null) {
        _handleStripeReturn(initialUri);
      }
    } catch (e) {
      debugPrint('Initial link error: $e');
    }

    // ---------- Foreground listener ----------
    _sub = _appLinks.uriLinkStream.listen((Uri uri) {
      _handleStripeReturn(uri);
    });
  }

  void _handleStripeReturn(Uri uri) {
    debugPrint('Incoming deep link: $uri');

    if (uri.scheme == 'baskmate' && uri.host == 'stripe-return') {
      Future.delayed(const Duration(milliseconds: 600), () async {
        if (!mounted) return;

        final auth = context.read<AuthProvider>();

        // Refresh Stripe status
        await auth.refreshUser();

        if (!mounted) return;

        // Show success feedback
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Stripe setup completed successfully'),
            backgroundColor: Colors.green,
          ),
        );

        // Navigate user back to store dashboard
        Navigator.of(context).pushNamedAndRemoveUntil(
          '/store-dashboard',
          (route) => false,
        );
      });
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

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
          update: (_, auth, notifications) =>
              notifications!..updateAuth(auth),
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
