import { apiClient } from './config';

export interface AdminStats {
  totalUsers: number;
  totalItems: number;
  totalRequests: number;
  activeItems: number;
  soldItems: number;
}

export interface AdminItem {
  id: string;
  name: string;
  price: number;
  isFree: boolean;
  status: string;
  imageURL?: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface AdminRequest {
  _id: string;
  itemName: string;
  quantity: string;
  category: string;
  status: string;
  user?: {
    name: string;
    email: string;
  };
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await apiClient.get('/admin/stats');
  return response.data;
};

export const getAdminItems = async (): Promise<AdminItem[]> => {
  const response = await apiClient.get('/admin/items');
  return response.data;
};

export const getAdminRequests = async (): Promise<AdminRequest[]> => {
  const response = await apiClient.get('/admin/requests');
  return response.data;
};
