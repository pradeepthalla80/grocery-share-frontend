import { apiClient } from './config';

export interface PickupRequest {
  _id: string;
  id: string;
  item: {
    _id: string;
    id: string;
    name: string;
    price: number;
    isFree: boolean;
    images?: string[];
    imageURL?: string;
  };
  buyer: {
    _id: string;
    id: string;
    name: string;
    email: string;
  };
  requester?: {
    _id: string;
    id: string;
    name: string;
    email: string;
  };
  seller: {
    _id: string;
    id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'declined' | 'awaiting_pickup' | 'completed' | 'canceled';
  requestType: 'free' | 'paid';
  deliveryMode?: string;
  sellerAddress?: string;
  sellerInstructions?: string;
  buyerConfirmed?: boolean;
  sellerConfirmed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const createPickupRequest = async (itemId: string): Promise<PickupRequest> => {
  const response = await apiClient.post('/pickup-requests', { itemId });
  return response.data.request || response.data;
};

export const getPickupRequests = async (params?: { role?: string; status?: string }): Promise<PickupRequest[]> => {
  const response = await apiClient.get('/pickup-requests', { params });
  return response.data.requests || response.data;
};

export const getPickupRequestById = async (requestId: string): Promise<PickupRequest> => {
  const response = await apiClient.get(`/pickup-requests/${requestId}`);
  return response.data.request || response.data;
};

export const acceptPickupRequest = async (requestId: string, data: {
  deliveryMode: string;
  address: string;
  instructions?: string;
}): Promise<PickupRequest> => {
  const response = await apiClient.patch(`/pickup-requests/${requestId}/accept`, data);
  return response.data.request || response.data;
};

export const declinePickupRequest = async (requestId: string): Promise<PickupRequest> => {
  const response = await apiClient.patch(`/pickup-requests/${requestId}/decline`);
  return response.data.request || response.data;
};

export const confirmPickupCompletion = async (requestId: string): Promise<PickupRequest> => {
  const response = await apiClient.post(`/pickup-requests/${requestId}/confirm`);
  return response.data.request || response.data;
};

export const cancelPickupRequest = async (requestId: string): Promise<void> => {
  await apiClient.delete(`/pickup-requests/${requestId}`);
};
