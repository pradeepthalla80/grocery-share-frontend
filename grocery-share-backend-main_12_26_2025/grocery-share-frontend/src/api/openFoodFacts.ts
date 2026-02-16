const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2';
const UPC_ITEMDB_BASE = 'https://api.upcitemdb.com/prod/trial';

export interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize?: string;
}

export interface ProductInfo {
  found: boolean;
  name?: string;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  brand?: string;
  quantity?: string;
  source?: string;
  nutrition?: NutritionInfo;
}

const lookupOpenFoodFacts = async (barcode: string, signal: AbortSignal): Promise<ProductInfo> => {
  const response = await fetch(
    `${OFF_API_BASE}/product/${barcode}?fields=product_name,categories_tags_en,brands,quantity,image_front_url,nutriments,serving_size`,
    { signal }
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

  let nutrition: NutritionInfo | undefined;
  const n = product.nutriments;
  if (n) {
    const cal = n['energy-kcal_100g'] ?? n['energy-kcal_serving'];
    const hasData = cal != null || n.proteins_100g != null || n.carbohydrates_100g != null || n.fat_100g != null;
    if (hasData) {
      nutrition = {
        calories: cal != null ? Math.round(Number(cal)) : undefined,
        protein: n.proteins_100g != null ? Math.round(Number(n.proteins_100g) * 10) / 10 : undefined,
        carbs: n.carbohydrates_100g != null ? Math.round(Number(n.carbohydrates_100g) * 10) / 10 : undefined,
        fat: n.fat_100g != null ? Math.round(Number(n.fat_100g) * 10) / 10 : undefined,
        fiber: n.fiber_100g != null ? Math.round(Number(n.fiber_100g) * 10) / 10 : undefined,
        sugar: n.sugars_100g != null ? Math.round(Number(n.sugars_100g) * 10) / 10 : undefined,
        sodium: n.sodium_100g != null ? Math.round(Number(n.sodium_100g) * 1000) : undefined,
        servingSize: product.serving_size || 'per 100g',
      };
    }
  }

  return {
    found: true,
    name: product.product_name || undefined,
    category: primaryCategory,
    tags: tags.length > 0 ? tags : undefined,
    imageUrl: product.image_front_url || undefined,
    brand: product.brands || undefined,
    quantity: product.quantity || undefined,
    source: 'Open Food Facts',
    nutrition,
  };
};

const lookupUPCitemdb = async (barcode: string, signal: AbortSignal): Promise<ProductInfo> => {
  const response = await fetch(
    `${UPC_ITEMDB_BASE}/lookup?upc=${barcode}`,
    {
      signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    return { found: false };
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    return { found: false };
  }

  const item = data.items[0];

  const category = item.category
    ? item.category.split('>').pop()?.trim()
    : undefined;

  return {
    found: true,
    name: item.title || undefined,
    category: category,
    tags: item.category
      ? item.category.split('>').map((s: string) => s.trim().toLowerCase()).filter(Boolean).slice(0, 5)
      : undefined,
    imageUrl: (item.images && item.images.length > 0) ? item.images[0] : undefined,
    brand: item.brand || undefined,
    quantity: item.size || undefined,
    source: 'UPC Database',
  };
};

const lookupFatSecret = async (barcode: string, signal: AbortSignal): Promise<ProductInfo> => {
  const response = await fetch(
    `/api/fatsecret/barcode/${barcode}`,
    { signal }
  );

  if (!response.ok) {
    return { found: false };
  }

  const data = await response.json();

  if (data.error || !data.food) {
    return { found: false };
  }

  const food = data.food;

  let category: string | undefined;
  const tags: string[] = [];
  if (food.food_type) {
    tags.push(food.food_type.toLowerCase());
  }
  if (food.food_sub_categories?.food_sub_category) {
    const subs = Array.isArray(food.food_sub_categories.food_sub_category)
      ? food.food_sub_categories.food_sub_category
      : [food.food_sub_categories.food_sub_category];
    category = subs[0];
    subs.slice(0, 4).forEach((s: string) => tags.push(s.toLowerCase()));
  }

  let nutrition: NutritionInfo | undefined;
  const servings = food.servings?.serving;
  if (servings) {
    const serving = Array.isArray(servings) ? servings[0] : servings;
    if (serving) {
      nutrition = {
        calories: serving.calories != null ? Math.round(Number(serving.calories)) : undefined,
        protein: serving.protein != null ? Math.round(Number(serving.protein) * 10) / 10 : undefined,
        carbs: serving.carbohydrate != null ? Math.round(Number(serving.carbohydrate) * 10) / 10 : undefined,
        fat: serving.fat != null ? Math.round(Number(serving.fat) * 10) / 10 : undefined,
        fiber: serving.fiber != null ? Math.round(Number(serving.fiber) * 10) / 10 : undefined,
        sugar: serving.sugar != null ? Math.round(Number(serving.sugar) * 10) / 10 : undefined,
        sodium: serving.sodium != null ? Math.round(Number(serving.sodium)) : undefined,
        servingSize: serving.serving_description || serving.metric_serving_amount
          ? `${serving.serving_description || ''}${serving.metric_serving_amount ? ` (${serving.metric_serving_amount}${serving.metric_serving_unit || 'g'})` : ''}`
          : undefined,
      };
    }
  }

  return {
    found: true,
    name: food.food_name || undefined,
    category: category,
    tags: tags.length > 0 ? tags : undefined,
    brand: food.brand_name || undefined,
    source: 'FatSecret',
    nutrition,
  };
};

export const lookupBarcode = async (barcode: string): Promise<ProductInfo> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const offResult = await lookupOpenFoodFacts(barcode, controller.signal);
    if (offResult.found) {
      return offResult;
    }

    const upcResult = await lookupUPCitemdb(barcode, controller.signal);
    if (upcResult.found) {
      return upcResult;
    }

    const fsResult = await lookupFatSecret(barcode, controller.signal);
    if (fsResult.found) {
      return fsResult;
    }

    return { found: false };
  } catch {
    return { found: false };
  } finally {
    clearTimeout(timeout);
  }
};
