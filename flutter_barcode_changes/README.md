# Flutter Barcode Scanner Changes

## Overview
These files add barcode scanning functionality to the BaskMate Flutter app.
Users can scan product barcodes on the Add Item screen to auto-fill item details
using a 3-database lookup chain for maximum product coverage:

1. **Open Food Facts** - 4M+ food products, free, no API key needed
2. **UPC Item DB** - 681M+ products (all categories), free trial, no key needed
3. **FatSecret** - 1.9M+ foods across 56 markets including Asian groceries (requires API key)

## Files to Add/Modify

### 1. pubspec.yaml - Add dependency
Add this under `dependencies:`:
```yaml
mobile_scanner: ^5.2.3
```
Then run: `flutter pub get`

### 2. iOS: ios/Runner/Info.plist - Add camera permission
Add inside the `<dict>` block (if not already present):
```xml
<key>NSCameraUsageDescription</key>
<string>BaskMate needs camera access to scan product barcodes</string>
```

### 3. Android: android/app/src/main/AndroidManifest.xml
Add inside `<manifest>` (if not already present):
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

### 4. New file: lib/services/open_food_facts_service.dart
Copy from this folder - handles barcode lookup via 3-database chain
(Open Food Facts -> UPC Item DB -> FatSecret).

### 5. New file: lib/widgets/barcode_scanner_screen.dart
Copy from this folder - full-screen camera barcode scanner widget.

### 6. Modify: lib/screens/items/add_item_screen.dart
Add a "Scan Barcode" button in the AppBar or above the form.
When scanned, call BarcodeService.lookupBarcode() and
set the form field controllers with the result.

### 7. FatSecret API Keys (for Flutter)
Pass as compile-time constants via `--dart-define`:
```bash
flutter run \
  --dart-define=FATSECRET_CLIENT_ID=your_client_id \
  --dart-define=FATSECRET_CLIENT_SECRET=your_client_secret
```

## What Gets Auto-filled
- Item Name (product name + brand)
- Category (primary category from database)
- Tags (up to 5 category tags)

## What Does NOT Get Auto-filled
- Expiry Date (not in barcodes - must enter manually)
- Price (user decides)
- Location (user's location)
- Images (user takes photos)

## No Backend Changes Required
All barcode APIs are called directly from the app.
No new backend endpoints needed.
