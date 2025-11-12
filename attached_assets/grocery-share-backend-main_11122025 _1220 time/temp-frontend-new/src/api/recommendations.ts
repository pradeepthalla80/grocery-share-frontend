import { apiClient } from './config';
import { type Item } from './items';

export const getRecommendations = async (lat?: number, lng?: number, limit = 10): Promise<{ count: number; items: Item[] }> => {
  const params = new URLSearchParams();
  if (lat !== undefined) params.append('lat', lat.toString());
  if (lng !== undefined) params.append('lng', lng.toString());
  params.append('limit', limit.toString());
  
  const response = await apiClient.get(`/recommendations?${params.toString()}`);
  return response.data;
};

export const getTrendingItems = async (lat?: number, lng?: number, limit = 10): Promise<{ count: number; items: Item[] }> => {
  const params = new URLSearchParams();
  if (lat !== undefined) params.append('lat', lat.toString());
  if (lng !== undefined) params.append('lng', lng.toString());
  params.append('limit', limit.toString());
  
  const response = await apiClient.get(`/recommendations/trending?${params.toString()}`);
  return response.data;
};
