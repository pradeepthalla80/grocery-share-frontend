import { apiClient } from './config';

export interface PickupRequest {
  id: string;
  item: {
    id: string;
    name: string;
    imageURL: string;
    price: number;
    isFree: boolean;
  };
  requester: {
    id: string;
    name: string;
    email: string;
  };
  seller: {
    id: string;
    name: string;
    email: string;
  };
  requestType: 'free' | 'paid';
  status: 'pending' | 'declined' | 'canceled' | 'awaiting_pickup' | 'completed';
  deliveryMode: 'pickup' | 'delivery' | null;
  sellerAddress: string | null;
  sellerInstructions: string | null;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  amountPaid: number;
  declineReason?: string | null;
  createdAt: string;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  completedAt?: string | null;
}

export interface CreatePickupRequestData {
  itemId: string;
  message?: string;
}

export interface AcceptPickupRequestData {
  deliveryMode: 'pickup' | 'delivery';
  address: string;
  instructions?: string;
}

export interface DeclinePickupRequestData {
  reason?: string;
}

export const pickupRequestsAPI = {
  // Create a new pickup request
  create: async (data: CreatePickupRequestData): Promise<{ request: PickupRequest }> => {
    const response = await apiClient.post('/pickup-requests', data);
    return response.data;
  },

  // Get all pickup requests with optional filters
  getAll: async (params?: { 
    role?: 'seller' | 'requester'; 
    status?: string 
  }): Promise<{ requests: PickupRequest[]; count: number }> => {
    const response = await apiClient.get('/pickup-requests', { params });
    return response.data;
  },

  // Get a specific pickup request by ID
  getById: async (requestId: string): Promise<{ request: PickupRequest }> => {
    const response = await apiClient.get(`/pickup-requests/${requestId}`);
    return response.data;
  },

  // Accept a pickup request (seller only)
  accept: async (
    requestId: string, 
    data: AcceptPickupRequestData
  ): Promise<{ request: Partial<PickupRequest> }> => {
    const response = await apiClient.patch(`/pickup-requests/${requestId}/accept`, data);
    return response.data;
  },

  // Decline a pickup request (seller only)
  decline: async (
    requestId: string, 
    data: DeclinePickupRequestData
  ): Promise<{ request: Partial<PickupRequest> }> => {
    const response = await apiClient.patch(`/pickup-requests/${requestId}/decline`, data);
    return response.data;
  },

  // Confirm pickup completion (buyer or seller)
  confirm: async (requestId: string): Promise<{ request: Partial<PickupRequest> }> => {
    const response = await apiClient.post(`/pickup-requests/${requestId}/confirm`);
    return response.data;
  },

  // Cancel a pickup request (requester only)
  cancel: async (requestId: string): Promise<{ request: Partial<PickupRequest> }> => {
    const response = await apiClient.delete(`/pickup-requests/${requestId}`);
    return response.data;
  },

  // Get pending requests for seller
  getPendingForSeller: async (): Promise<{ requests: PickupRequest[]; count: number }> => {
    return pickupRequestsAPI.getAll({ role: 'seller', status: 'pending' });
  },

  // Get active requests for requester
  getActiveForRequester: async (): Promise<{ requests: PickupRequest[]; count: number }> => {
    return pickupRequestsAPI.getAll({ role: 'requester' });
  },
};
