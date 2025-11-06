import { apiClient } from './config';

export interface ItemRequest {
  _id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  itemName: string;
  quantity: string;
  category: string;
  notes?: string;
  location: {
    type: string;
    coordinates: number[];
  };
  address?: string;
  zipCode?: string;
  approximateLocation?: string;
  status: 'active' | 'fulfilled' | 'cancelled';
  distance?: number;
  responses: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
    message: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const createItemRequest = async (data: {
  itemName: string;
  quantity: string;
  category: string;
  notes?: string;
  location: { coordinates: number[] };
  address?: string;
  zipCode?: string;
  approximateLocation?: string;
  validityPeriod?: string;
}) => {
  const response = await apiClient.post('/item-requests', data);
  return response.data;
};

export const getNearbyRequests = async (latitude: number, longitude: number, radius = 10) => {
  const response = await apiClient.get('/item-requests/nearby', {
    params: { latitude, longitude, radius }
  });
  return response.data;
};

export const getMyRequests = async () => {
  const response = await apiClient.post('/item-requests/my-requests');
  return response.data;
};

export const respondToRequest = async (requestId: string, message?: string) => {
  const response = await apiClient.post(`/item-requests/${requestId}/respond`, { message });
  return response.data;
};

export const updateRequestStatus = async (requestId: string, status: 'active' | 'fulfilled' | 'cancelled') => {
  const response = await apiClient.put(`/item-requests/${requestId}/status`, { status });
  return response.data;
};

export const getRequestById = async (requestId: string): Promise<ItemRequest> => {
  const response = await apiClient.get(`/item-requests/${requestId}`);
  return response.data;
};

export const deleteRequest = async (requestId: string) => {
  const response = await apiClient.delete(`/item-requests/${requestId}`);
  return response.data;
};

export const deleteItemRequest = async (requestId: string) => {
  const response = await apiClient.delete(`/item-requests/${requestId}`);
  return response.data;
};
