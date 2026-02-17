import { apiClient } from './config';

export interface Plan {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  features: string[];
}

export interface SubscriptionInfo {
  plan: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  commissionRate: number;
}

export const subscriptionAPI = {
  getPlans: async (): Promise<{ plans: Plan[]; currentPlan: string }> => {
    const res = await apiClient.get('/subscription/plans');
    return res.data;
  },

  getCurrentSubscription: async (): Promise<SubscriptionInfo> => {
    const res = await apiClient.get('/subscription/current');
    return res.data;
  },

  createCheckoutSession: async (planId: string): Promise<{ url: string; sessionId: string }> => {
    const res = await apiClient.post('/subscription/checkout', { planId });
    return res.data;
  },

  cancelSubscription: async (): Promise<{ success: boolean; message: string; cancelAt: string }> => {
    const res = await apiClient.post('/subscription/cancel');
    return res.data;
  },

  verifySession: async (sessionId: string): Promise<{ success: boolean; plan: string; subscriptionStatus: string }> => {
    const res = await apiClient.get(`/subscription/verify?sessionId=${sessionId}`);
    return res.data;
  }
};
