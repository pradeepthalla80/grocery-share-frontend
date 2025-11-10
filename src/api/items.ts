import { apiClient } from './config';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Item {
  id: string;
  name: string;
  imageURL: string;
  images: string[];
  category: string | null;
  tags: string[];
  expiryDate: string;
  price: number;
  isFree: boolean;
  pickupTimeStart: string | null;
  pickupTimeEnd: string | null;
  flexiblePickup: boolean;
  location: Location;
  user?: {
    id: string;
    name: string;
    email: string;
    storeName?: string;
  };
  notified: boolean;
  distance?: number;
  status?: 'available' | 'sold' | 'refunded';
  buyerId?: string;
  offerDelivery?: boolean;
  deliveryFee?: number;
  isStoreItem?: boolean;
  quantity?: number | null;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'low_stock' | 'unlimited' | null;
  originalQuantity?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemData {
  name: string;
  imageURL: string;
  category?: string;
  tags?: string[];
  expiryDate: string;
  price: number;
  location: Location;
}

export interface UpdateItemData {
  name?: string;
  imageURL?: string;
  category?: string;
  tags?: string[];
  expiryDate?: string;
  price?: number;
  location?: Location;
}

export interface SearchParams {
  lat: number;
  lng: number;
  radius?: number;
  keyword?: string;
  category?: string;
  tags?: string;
  onlyStoreItems?: string;
}

export interface ItemsResponse {
  count: number;
  radius?: number;
  items: Item[];
}

export const itemsAPI = {
  search: async (params: SearchParams): Promise<ItemsResponse> => {
    const response = await apiClient.get('/items', { params });
    return response.data;
  },

  getMyItems: async (): Promise<ItemsResponse> => {
    const response = await apiClient.get('/items/my-items');
    return response.data;
  },

  getById: async (id: string): Promise<Item> => {
    const response = await apiClient.get(`/items/${id}`);
    return response.data;
  },

  create: async (data: CreateItemData | FormData): Promise<{ message: string; item: Item }> => {
    const response = await apiClient.post('/items', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  update: async (id: string, data: UpdateItemData | FormData): Promise<{ message: string; item: Item }> => {
    const response = await apiClient.put(`/items/${id}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/items/${id}`);
    return response.data;
  },
};
