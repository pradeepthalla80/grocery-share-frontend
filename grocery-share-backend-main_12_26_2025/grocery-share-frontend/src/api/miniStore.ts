import { apiClient } from './config';

export interface MiniStoreAvailability {
  available: boolean;
  reason: string;
  waitlistOpen: boolean;
}

export interface ZipSetting {
  zipCode: string;
  maxStores: number;
  paused: boolean;
  disabled: boolean;
  waitlistOnly: boolean;
  requireApproval: boolean;
}

export interface MiniStoreSettings {
  _id: string;
  enabled: boolean;
  waitlistEnabled: boolean;
  requireApproval: boolean;
  defaultMaxStoresPerZip: number;
  zipSettings: ZipSetting[];
}

export interface MiniStoreRequestItem {
  _id: string;
  user: { _id: string; name: string; email: string };
  email: string;
  zipCode: string;
  storeName: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'store_request' | 'waitlist';
  notes: string;
  reviewedBy?: { name: string };
  reviewedAt?: string;
  createdAt: string;
}

export const miniStoreAPI = {
  checkAvailability: async (zip: string): Promise<MiniStoreAvailability> => {
    const response = await apiClient.get(`/mini-store/availability?zip=${zip}`);
    return response.data;
  },

  joinWaitlist: async (zipCode: string, email?: string) => {
    const response = await apiClient.post('/mini-store/waitlist', { zipCode, email });
    return response.data;
  },

  submitStoreRequest: async (data: { zipCode: string; storeName?: string; email?: string }) => {
    const response = await apiClient.post('/mini-store/request', data);
    return response.data;
  },

  getSettings: async (): Promise<MiniStoreSettings> => {
    const response = await apiClient.get('/mini-store/admin/settings');
    return response.data;
  },

  updateSettings: async (data: Partial<Pick<MiniStoreSettings, 'enabled' | 'waitlistEnabled' | 'requireApproval' | 'defaultMaxStoresPerZip'>>) => {
    const response = await apiClient.put('/mini-store/admin/settings', data);
    return response.data;
  },

  updateZipSettings: async (data: Partial<ZipSetting> & { zipCode: string }) => {
    const response = await apiClient.put('/mini-store/admin/zip-settings', data);
    return response.data;
  },

  deleteZipSettings: async (zipCode: string) => {
    const response = await apiClient.delete(`/mini-store/admin/zip-settings/${zipCode}`);
    return response.data;
  },

  getRequests: async (filters?: { status?: string; type?: string; zip?: string }): Promise<{ requests: MiniStoreRequestItem[] }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.zip) params.append('zip', filters.zip);
    const response = await apiClient.get(`/mini-store/admin/requests?${params.toString()}`);
    return response.data;
  },

  reviewRequest: async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    const response = await apiClient.put(`/mini-store/admin/requests/${id}`, { status, notes });
    return response.data;
  },
};
