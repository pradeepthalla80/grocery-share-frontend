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

  ProductInfo({
    required this.found,
    this.name,
    this.category,
    this.tags,
    this.imageUrl,
    this.brand,
    this.quantity,
  });
}

class OpenFoodFactsService {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: 'https://world.openfoodfacts.org/api/v2',
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  static Future<ProductInfo> lookupBarcode(String barcode) async {
    try {
      developer.log('[OpenFoodFacts] Looking up barcode: $barcode');

      final response = await _dio.get(
        '/product/$barcode',
        queryParameters: {
          'fields': 'product_name,categories_tags_en,brands,quantity,image_front_url',
        },
      );

      final data = response.data;
      if (data['status'] != 1 || data['product'] == null) {
        developer.log('[OpenFoodFacts] Product not found for barcode: $barcode');
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

      final result = ProductInfo(
        found: true,
        name: product['product_name']?.toString(),
        category: primaryCategory,
        tags: tags.isNotEmpty ? tags.cast<String>() : null,
        imageUrl: product['image_front_url']?.toString(),
        brand: product['brands']?.toString(),
        quantity: product['quantity']?.toString(),
      );

      developer.log('[OpenFoodFacts] Found: ${result.name} by ${result.brand}');
      return result;
    } catch (e) {
      developer.log('[OpenFoodFacts] Lookup error: $e');
      return ProductInfo(found: false);
    }
  }
}
