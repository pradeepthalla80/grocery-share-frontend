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

// User Management Types
export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  isStoreOwner?: boolean;
  storeMode?: boolean;
  storeName?: string | null;
  averageRating?: number;
  ratingCount?: number;
  createdAt: string;
  updatedAt: string;
  activityCounts?: {
    items: number;
    requests: number;
  };
}

export interface AdminUserDetail extends AdminUser {
  activity?: {
    recentItems: any[];
    recentRequests: any[];
    totalItems: number;
    totalRequests: number;
  };
}

// User Management Functions
export const getAdminUsers = async (params?: {
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  order?: string;
}): Promise<{ users: AdminUser[]; total: number }> => {
  const response = await apiClient.get('/admin/users', { params });
  return response.data;
};

export const getAdminUserDetails = async (userId: string): Promise<AdminUserDetail> => {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data;
};

export const updateUserRole = async (userId: string, role: string) => {
  const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export const deleteUser = async (userId: string) => {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
};

export const toggleStoreOwner = async (userId: string, isStoreOwner: boolean) => {
  const response = await apiClient.put(`/admin/users/${userId}/store-status`, { isStoreOwner });
  return response.data;
};
