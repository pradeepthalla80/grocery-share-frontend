import { apiClient } from './config';

export interface Plan {
  id: string;
  name: string;
  price: number;
  yearlyPrice?: number | null;
  commissionRate: number;
  features: string[];
}

export interface SubscriptionInfo {
  plan: string;
  effectivePlan?: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  commissionRate: number;
  testMode?: boolean;
}

export const subscriptionAPI = {
  getPlans: async (): Promise<{ plans: Plan[]; currentPlan: string; testMode?: boolean }> => {
    const res = await apiClient.get('/subscription/plans');
    return res.data;
  },

  getCurrentSubscription: async (): Promise<SubscriptionInfo> => {
    const res = await apiClient.get('/subscription/current');
    return res.data;
  },

  createCheckoutSession: async (planId: string, interval: 'month' | 'year' = 'month'): Promise<{ url: string; sessionId: string }> => {
    const res = await apiClient.post('/subscription/checkout', { planId, interval });
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
