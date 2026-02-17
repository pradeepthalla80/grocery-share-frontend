const fetch = require('node-fetch');

const HF_API_BASE = 'https://api-inference.huggingface.co/models';
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

const MODELS = {
  FOOD_CATEGORY: 'Kaludi/food-category-classification-v2.0',
  FOOD_TYPE: 'nateraw/food',
  TEXT_MODERATION: 'KoalaAI/Text-Moderation',
  EMBEDDINGS: 'sentence-transformers/all-MiniLM-L6-v2',
  FRESHNESS: 'RicardoPoleo/custom_cnn_model',
};

const FOOD_CATEGORY_MAP = {
  'Bread': 'Bakery',
  'Dairy product': 'Dairy',
  'Dessert': 'Desserts',
  'Egg': 'Dairy',
  'Fried food': 'Snacks',
  'Meat': 'Meat',
  'Noodles-Pasta': 'Grains & Pasta',
  'Rice': 'Grains & Pasta',
  'Seafood': 'Seafood',
  'Soup': 'Canned Goods',
  'Fruit': 'Fruits',
  'Vegetable-Fruit': 'Fruits',
  'Vegetable': 'Vegetables',
};

async function queryHuggingFace(model, payload, options = {}) {
  if (!HF_TOKEN) {
    throw new Error('HUGGINGFACE_API_TOKEN not configured');
  }

  const url = `${HF_API_BASE}/${model}`;
  const headers = {
    'Authorization': `Bearer ${HF_TOKEN}`,
  };

  let body;
  if (Buffer.isBuffer(payload)) {
    headers['Content-Type'] = 'application/octet-stream';
    body = payload;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(payload);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
    timeout: 60000,
  });

  if (response.status === 503) {
    const data = await response.json();
    if (data.estimated_time && !options.retried) {
      console.log(`Model ${model} is loading, estimated time: ${data.estimated_time}s. Retrying once...`);
      const waitTime = Math.min((data.estimated_time || 20) * 1000, 30000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return queryHuggingFace(model, payload, { ...options, retried: true });
    }
    throw new Error(`Model ${model} is currently unavailable (loading). Please try again in a moment.`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function recognizeFood(imageBuffer) {
  try {
    const [categoryResults, typeResults] = await Promise.allSettled([
      queryHuggingFace(MODELS.FOOD_CATEGORY, imageBuffer),
      queryHuggingFace(MODELS.FOOD_TYPE, imageBuffer),
    ]);

    const suggestions = {
      categories: [],
      foodTypes: [],
      bestCategory: null,
      bestName: null,
      confidence: 0,
    };

    if (categoryResults.status === 'fulfilled' && Array.isArray(categoryResults.value)) {
      suggestions.categories = categoryResults.value
        .filter(r => r.score > 0.1)
        .slice(0, 3)
        .map(r => ({
          label: r.label,
          appCategory: FOOD_CATEGORY_MAP[r.label] || 'Other',
          confidence: Math.round(r.score * 100),
        }));

      if (suggestions.categories.length > 0) {
        suggestions.bestCategory = suggestions.categories[0].appCategory;
        suggestions.confidence = suggestions.categories[0].confidence;
      }
    }

    if (typeResults.status === 'fulfilled' && Array.isArray(typeResults.value)) {
      suggestions.foodTypes = typeResults.value
        .filter(r => r.score > 0.1)
        .slice(0, 5)
        .map(r => ({
          name: r.label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          confidence: Math.round(r.score * 100),
        }));

      if (suggestions.foodTypes.length > 0) {
        suggestions.bestName = suggestions.foodTypes[0].name;
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Food recognition error:', error.message);
    throw error;
  }
}

async function moderateText(text) {
  try {
    const results = await queryHuggingFace(MODELS.TEXT_MODERATION, { inputs: text });

    if (!Array.isArray(results) || !Array.isArray(results[0])) {
      return { flagged: false, categories: [], safe: true };
    }

    const labels = results[0];
    const dominated = labels.reduce((max, l) => l.score > max.score ? l : max, labels[0]);

    const flaggedCategories = labels
      .filter(l => l.label !== 'OK' && l.score > 0.5)
      .map(l => ({ label: l.label, score: Math.round(l.score * 100) }));

    const isFlagged = dominated.label !== 'OK' && dominated.score > 0.7;

    return {
      flagged: isFlagged,
      dominantLabel: dominated.label,
      dominantScore: Math.round(dominated.score * 100),
      categories: flaggedCategories,
      safe: !isFlagged,
    };
  } catch (error) {
    console.error('Text moderation error:', error.message);
    return { flagged: false, safe: true, error: 'Moderation service unavailable' };
  }
}

async function getEmbedding(text) {
  try {
    const result = await queryHuggingFace(MODELS.EMBEDDINGS, {
      inputs: text,
      options: { wait_for_model: true },
    });
    return result;
  } catch (error) {
    console.error('Embedding error:', error.message);
    throw error;
  }
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function semanticSearch(query, items) {
  try {
    const textsToEmbed = [query, ...items.map(item => {
      const parts = [item.name];
      if (item.category) parts.push(item.category);
      if (item.tags && item.tags.length) parts.push(item.tags.join(' '));
      if (item.description) parts.push(item.description);
      return parts.join(' ');
    })];

    const embeddings = await queryHuggingFace(MODELS.EMBEDDINGS, {
      inputs: textsToEmbed,
      options: { wait_for_model: true },
    });

    if (!Array.isArray(embeddings) || embeddings.length < 2) {
      throw new Error('Invalid embedding response');
    }

    const queryEmbedding = embeddings[0];
    const scored = items.map((item, idx) => ({
      ...item,
      similarityScore: cosineSimilarity(queryEmbedding, embeddings[idx + 1]),
    }));

    return scored
      .filter(item => item.similarityScore > 0.25)
      .sort((a, b) => b.similarityScore - a.similarityScore);
  } catch (error) {
    console.error('Semantic search error:', error.message);
    throw error;
  }
}

async function checkFreshness(imageBuffer) {
  try {
    const results = await queryHuggingFace(MODELS.FRESHNESS, imageBuffer);

    if (!Array.isArray(results)) {
      return { score: null, label: 'unknown', error: 'Invalid response' };
    }

    const freshLabels = results.filter(r =>
      r.label.toLowerCase().includes('fresh') && !r.label.toLowerCase().includes('rotten')
    );
    const rottenLabels = results.filter(r =>
      r.label.toLowerCase().includes('rotten') || r.label.toLowerCase().includes('stale')
    );

    const freshScore = freshLabels.reduce((sum, l) => sum + l.score, 0);
    const rottenScore = rottenLabels.reduce((sum, l) => sum + l.score, 0);

    let score, label;
    if (freshScore + rottenScore < 0.1) {
      score = null;
      label = 'unknown';
    } else {
      score = Math.round((freshScore / (freshScore + rottenScore)) * 100);
      if (score >= 80) label = 'fresh';
      else if (score >= 50) label = 'moderate';
      else label = 'poor';
    }

    return {
      score,
      label,
      details: results.slice(0, 5).map(r => ({
        label: r.label,
        confidence: Math.round(r.score * 100),
      })),
    };
  } catch (error) {
    console.error('Freshness check error:', error.message);
    throw error;
  }
}

module.exports = {
  recognizeFood,
  moderateText,
  getEmbedding,
  semanticSearch,
  checkFreshness,
  cosineSimilarity,
};
