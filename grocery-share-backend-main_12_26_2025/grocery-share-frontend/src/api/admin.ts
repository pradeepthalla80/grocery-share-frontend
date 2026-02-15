import { apiClient } from './config';

export interface AdminStats {
  totalUsers: number;
  totalItems: number;
  totalRequests: number;
  activeItems: number;
  soldItems: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isStoreOwner?: boolean;
  storeMode?: boolean;
  storeName?: string;
  createdAt: string;
  activityCounts: {
    items: number;
    requests: number;
  };
}

export interface AdminItem {
  id: string;
  name: string;
  price: number;
  isFree: boolean;
  status: string;
  imageURL: string | null;
  user: { _id: string; name: string; email: string };
}

export const adminAPI = {
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  getUsers: async (params?: { search?: string; role?: string; sortBy?: string; order?: string }): Promise<{ users: AdminUser[]; total: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.order) queryParams.append('order', params.order);
    const response = await apiClient.get(`/admin/users?${queryParams.toString()}`);
    return response.data;
  },

  getItems: async (): Promise<AdminItem[]> => {
    const response = await apiClient.get('/admin/items');
    return response.data;
  },

  updateUserRole: async (userId: string, role: string): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/role`, { role });
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  toggleStoreStatus: async (userId: string, isStoreOwner: boolean): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/store-status`, { isStoreOwner });
  },
};
