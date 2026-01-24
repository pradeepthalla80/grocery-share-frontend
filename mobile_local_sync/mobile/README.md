# BaskMate Mobile App

A Flutter mobile application for BaskMate - Your Emergency Pantry Next Door.

## Overview

BaskMate is a peer-to-peer platform for sharing, requesting, and exchanging surplus grocery items within local communities. This mobile app provides native iOS and Android experiences with full feature parity to the web application.

## Features

- **Authentication**: Email/password and Google Sign-In
- **Item Listings**: Browse, search, filter, and list grocery items
- **Requests**: Post and respond to item requests
- **Real-time Chat**: Message other users directly
- **Notifications**: Stay updated on activity
- **Store Owner Mode**: Sell items as a micro-store
- **Stripe Payments**: Secure payment processing with Stripe Connect
- **Admin Dashboard**: Manage users and content (admin only)

## Prerequisites

- Flutter SDK 3.0.0 or higher
- Dart 3.0.0 or higher
- Android Studio / Xcode for platform-specific builds
- Backend API running at `https://grocery-share-backend.onrender.com`

## Getting Started

### 1. Install Flutter

Follow the official Flutter installation guide:
https://docs.flutter.dev/get-started/install

### 2. Clone and Setup

```bash
cd mobile
flutter pub get
```

### 3. Configure Environment

Create environment variables for:
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `GOOGLE_CLIENT_ID`: Google OAuth client ID

### 4. Run the App

```bash
# Run on iOS Simulator
flutter run -d ios

# Run on Android Emulator
flutter run -d android

# Run on connected device
flutter run
```

## Project Structure

```
lib/
├── config/           # App configuration, theme, routes
├── models/           # Data models
├── providers/        # State management (Provider)
├── screens/          # UI screens
│   ├── auth/         # Login, Register, Forgot Password
│   ├── home/         # Main home screen
│   ├── items/        # Item listings, detail, add/edit
│   ├── requests/     # Item requests
│   ├── chat/         # Messaging
│   ├── notifications/# Notifications
│   ├── profile/      # User profile
│   ├── store/        # Store owner features
│   ├── seller/       # Seller payments (Stripe)
│   ├── analytics/    # Community impact
│   ├── admin/        # Admin dashboard
│   ├── settings/     # App settings
│   └── legal/        # Terms, Privacy
├── services/         # API services
├── widgets/          # Reusable UI components
└── main.dart         # App entry point
```

## Architecture

- **State Management**: Provider with ChangeNotifier
- **HTTP Client**: Dio with interceptors for auth
- **Secure Storage**: flutter_secure_storage for tokens
- **Maps**: flutter_map with OpenStreetMap
- **Payments**: flutter_stripe for payment UI

## Backend API

The app connects to the same backend as the web application:
- Base URL: `https://grocery-share-backend.onrender.com/api/v1`
- Authentication: JWT tokens stored securely
- All endpoints match the web app implementation

## Building for Production

### Android

```bash
flutter build apk --release
# or for app bundle
flutter build appbundle --release
```

### iOS

```bash
flutter build ios --release
```

## Platform Guidelines

This app follows:
- Apple App Store Review Guidelines
- Google Play Store Policies
- Material Design 3 guidelines
- Human Interface Guidelines for iOS

## Support

Contact: support@groceryshare.app

## License

Proprietary - All rights reserved
