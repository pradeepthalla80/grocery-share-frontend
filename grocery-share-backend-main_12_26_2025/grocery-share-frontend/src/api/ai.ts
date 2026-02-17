import { apiClient } from './config';

export interface FoodSuggestion {
  label: string;
  appCategory: string;
  confidence: number;
}

export interface FoodType {
  name: string;
  confidence: number;
}

export interface RecognizeFoodResponse {
  success: boolean;
  suggestions: {
    categories: FoodSuggestion[];
    foodTypes: FoodType[];
    bestCategory: string | null;
    bestName: string | null;
    confidence: number;
  };
}

export interface FreshnessResponse {
  success: boolean;
  freshness: {
    score: number | null;
    label: 'fresh' | 'moderate' | 'poor' | 'unknown';
    details: { label: string; confidence: number }[];
  };
}

export interface SmartSearchResponse {
  success: boolean;
  query: string;
  count: number;
  items: Array<{
    id: string;
    name: string;
    category: string;
    tags: string[];
    imageURL: string;
    images: string[];
    expiryDate: string;
    price: number;
    isFree: boolean;
    location: { type: string; coordinates: number[] };
    address: string;
    user: { _id: string; name: string };
    createdAt: string;
    similarityScore: number;
  }>;
}

export const aiAPI = {
  recognizeFood: async (imageFile: File): Promise<RecognizeFoodResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await apiClient.post('/ai/recognize-food', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data;
  },

  recognizeFoodFromUrl: async (imageUrl: string): Promise<RecognizeFoodResponse> => {
    const response = await apiClient.post('/ai/recognize-food', { imageUrl }, {
      timeout: 60000,
    });
    return response.data;
  },

  smartSearch: async (params: {
    query: string;
    lat: number;
    lng: number;
    radius?: number;
    limit?: number;
  }): Promise<SmartSearchResponse> => {
    const response = await apiClient.get('/ai/smart-search', {
      params,
      timeout: 60000,
    });
    return response.data;
  },

  checkFreshness: async (imageFile: File): Promise<FreshnessResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await apiClient.post('/ai/freshness-check', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data;
  },

  checkFreshnessFromUrl: async (imageUrl: string): Promise<FreshnessResponse> => {
    const response = await apiClient.post('/ai/freshness-check', { imageUrl }, {
      timeout: 60000,
    });
    return response.data;
  },
};
