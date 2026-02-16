# Changes Needed in add_item_screen.dart

## 1. Add Imports (at top of file)
```dart
import '../../services/open_food_facts_service.dart';
import '../../widgets/barcode_scanner_screen.dart';
```

## 2. Add State Variables (in the State class)
```dart
bool _scanLoading = false;
ProductInfo? _scanResult;
```

## 3. Add Scan Method (in the State class)
```dart
Future<void> _scanBarcode() async {
  final barcode = await Navigator.of(context).push<String?>(
    MaterialPageRoute(builder: (_) => const BarcodeScannerScreen()),
  );

  if (barcode == null || !mounted) return;

  setState(() {
    _scanLoading = true;
    _scanResult = null;
  });

  final product = await OpenFoodFactsService.lookupBarcode(barcode);

  if (!mounted) return;

  setState(() {
    _scanLoading = false;
    _scanResult = product;
  });

  if (product.found) {
    if (product.name != null) {
      final displayName = product.brand != null
          ? '${product.brand} ${product.name}'
          : product.name!;
      _nameController.text = displayName;
    }
    if (product.category != null) {
      _categoryController.text = product.category!;
    }
    if (product.tags != null && product.tags!.isNotEmpty) {
      _tagsController.text = product.tags!.join(', ');
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Product found: ${product.name ?? "Unknown"}'),
        backgroundColor: Colors.green,
      ),
    );
  } else {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Product not found. Please fill in details manually.'),
        backgroundColor: Colors.orange,
      ),
    );
  }
}
```

## 4. Add Scan Button in AppBar
In the AppBar `actions` list, add:
```dart
IconButton(
  icon: _scanLoading
      ? const SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
        )
      : const Icon(Icons.qr_code_scanner),
  onPressed: _scanLoading ? null : _scanBarcode,
  tooltip: 'Scan Barcode',
),
```

## Summary
- The scan button opens a full-screen camera view
- When a barcode is detected, it looks up the product on Open Food Facts
- If found, it auto-fills name, category, and tags
- If not found, shows a message to fill in manually
- No backend calls needed - direct API to Open Food Facts
