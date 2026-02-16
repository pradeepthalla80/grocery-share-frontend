# Flutter Barcode Scanner Changes

## Overview
These files add barcode scanning functionality to the BaskMate Flutter app.
Users can scan product barcodes on the Add Item screen to auto-fill item details
using the Open Food Facts database (free, no API key needed).

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
Copy from this folder - handles barcode lookup via Open Food Facts API.

### 5. New file: lib/widgets/barcode_scanner_screen.dart
Copy from this folder - full-screen camera barcode scanner widget.

### 6. Modify: lib/screens/items/add_item_screen.dart
Add a "Scan Barcode" button in the AppBar or above the form.
When scanned, call OpenFoodFactsService.lookupBarcode() and
set the form field controllers with the result.

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
The Open Food Facts API is called directly from the app.
No new backend endpoints needed.
