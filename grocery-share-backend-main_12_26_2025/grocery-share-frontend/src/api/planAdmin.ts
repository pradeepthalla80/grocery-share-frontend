import { apiClient } from './config';

export interface AdminPlan {
  planId: string;
  name: string;
  price: number;
  commissionRate: number;
  features: string[];
  active: boolean;
  sortOrder: number;
  stripeProductId?: string;
  stripePriceId?: string;
}

export interface PlatformSettingsResponse {
  testMode: boolean;
  testModeUpdatedAt: string | null;
  plans: AdminPlan[];
}

export const planAdminAPI = {
  getSettings: async (): Promise<PlatformSettingsResponse> => {
    const res = await apiClient.get('/plan-admin/settings');
    return res.data;
  },

  toggleTestMode: async (enabled: boolean): Promise<{ testMode: boolean; message: string }> => {
    const res = await apiClient.put('/plan-admin/test-mode', { enabled });
    return res.data;
  },

  updatePlan: async (planId: string, data: Partial<AdminPlan>): Promise<{ plan: AdminPlan; message: string }> => {
    const res = await apiClient.put(`/plan-admin/plans/${planId}`, data);
    return res.data;
  },

  createPlan: async (data: { planId: string; name: string; price?: number; commissionRate?: number; features?: string[] }): Promise<{ plan: AdminPlan; message: string }> => {
    const res = await apiClient.post('/plan-admin/plans', data);
    return res.data;
  },

  deletePlan: async (planId: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/plan-admin/plans/${planId}`);
    return res.data;
  },

  getTestModeStatus: async (): Promise<{ testMode: boolean }> => {
    const res = await apiClient.get('/plan-admin/test-mode/status');
    return res.data;
  }
};
