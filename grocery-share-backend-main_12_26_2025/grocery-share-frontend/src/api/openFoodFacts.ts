const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2';

export interface ProductInfo {
  found: boolean;
  name?: string;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  brand?: string;
  quantity?: string;
}

export const lookupBarcode = async (barcode: string): Promise<ProductInfo> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `${OFF_API_BASE}/product/${barcode}?fields=product_name,categories_tags_en,brands,quantity,image_front_url`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      return { found: false };
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return { found: false };
    }

    const product = data.product;

    const categories = product.categories_tags_en || [];
    const primaryCategory = categories.length > 0
      ? categories[0].replace(/^en:/, '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
      : undefined;

    const tags = categories
      .slice(0, 5)
      .map((tag: string) => tag.replace(/^en:/, '').replace(/-/g, ' '));

    return {
      found: true,
      name: product.product_name || undefined,
      category: primaryCategory,
      tags: tags.length > 0 ? tags : undefined,
      imageUrl: product.image_front_url || undefined,
      brand: product.brands || undefined,
      quantity: product.quantity || undefined,
    };
  } catch {
    return { found: false };
  } finally {
    clearTimeout(timeout);
  }
};
