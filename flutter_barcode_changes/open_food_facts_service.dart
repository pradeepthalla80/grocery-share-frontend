import 'dart:developer' as developer;
import 'package:dio/dio.dart';

class ProductInfo {
  final bool found;
  final String? name;
  final String? category;
  final List<String>? tags;
  final String? imageUrl;
  final String? brand;
  final String? quantity;
  final String? source;

  ProductInfo({
    required this.found,
    this.name,
    this.category,
    this.tags,
    this.imageUrl,
    this.brand,
    this.quantity,
    this.source,
  });
}

class BarcodeService {
  static final Dio _offDio = Dio(BaseOptions(
    baseUrl: 'https://world.openfoodfacts.org/api/v2',
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  static final Dio _upcDio = Dio(BaseOptions(
    baseUrl: 'https://api.upcitemdb.com/prod/trial',
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  static Future<ProductInfo> lookupBarcode(String barcode) async {
    final offResult = await _lookupOpenFoodFacts(barcode);
    if (offResult.found) return offResult;

    final upcResult = await _lookupUPCitemdb(barcode);
    if (upcResult.found) return upcResult;

    return ProductInfo(found: false);
  }

  static Future<ProductInfo> _lookupOpenFoodFacts(String barcode) async {
    try {
      developer.log('[BarcodeService] Trying Open Food Facts for: $barcode');

      final response = await _offDio.get(
        '/product/$barcode',
        queryParameters: {
          'fields': 'product_name,categories_tags_en,brands,quantity,image_front_url',
        },
      );

      final data = response.data;
      if (data['status'] != 1 || data['product'] == null) {
        developer.log('[BarcodeService] Not found in Open Food Facts');
        return ProductInfo(found: false);
      }

      final product = data['product'];
      final categoriesTags = (product['categories_tags_en'] as List<dynamic>?) ?? [];

      String? primaryCategory;
      if (categoriesTags.isNotEmpty) {
        primaryCategory = categoriesTags[0]
            .toString()
            .replaceAll(RegExp(r'^en:'), '')
            .replaceAll('-', ' ')
            .split(' ')
            .map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '')
            .join(' ');
      }

      final tags = categoriesTags
          .take(5)
          .map((tag) => tag.toString().replaceAll(RegExp(r'^en:'), '').replaceAll('-', ' '))
          .toList();

      developer.log('[BarcodeService] Found in Open Food Facts: ${product['product_name']}');
      return ProductInfo(
        found: true,
        name: product['product_name']?.toString(),
        category: primaryCategory,
        tags: tags.isNotEmpty ? tags.cast<String>() : null,
        imageUrl: product['image_front_url']?.toString(),
        brand: product['brands']?.toString(),
        quantity: product['quantity']?.toString(),
        source: 'Open Food Facts',
      );
    } catch (e) {
      developer.log('[BarcodeService] Open Food Facts error: $e');
      return ProductInfo(found: false);
    }
  }

  static Future<ProductInfo> _lookupUPCitemdb(String barcode) async {
    try {
      developer.log('[BarcodeService] Trying UPC Database for: $barcode');

      final response = await _upcDio.get(
        '/lookup',
        queryParameters: {'upc': barcode},
      );

      final data = response.data;
      final items = data['items'] as List<dynamic>?;
      if (items == null || items.isEmpty) {
        developer.log('[BarcodeService] Not found in UPC Database');
        return ProductInfo(found: false);
      }

      final item = items[0];
      final categoryStr = item['category']?.toString();
      String? category;
      List<String>? tags;

      if (categoryStr != null && categoryStr.isNotEmpty) {
        final parts = categoryStr.split('>').map((s) => s.trim()).toList();
        category = parts.last;
        tags = parts.map((s) => s.toLowerCase()).where((s) => s.isNotEmpty).take(5).toList();
      }

      final images = item['images'] as List<dynamic>?;
      final imageUrl = (images != null && images.isNotEmpty) ? images[0]?.toString() : null;

      developer.log('[BarcodeService] Found in UPC Database: ${item['title']}');
      return ProductInfo(
        found: true,
        name: item['title']?.toString(),
        category: category,
        tags: tags,
        imageUrl: imageUrl,
        brand: item['brand']?.toString(),
        quantity: item['size']?.toString(),
        source: 'UPC Database',
      );
    } catch (e) {
      developer.log('[BarcodeService] UPC Database error: $e');
      return ProductInfo(found: false);
    }
  }
}
