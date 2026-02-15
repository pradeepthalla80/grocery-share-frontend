import { apiClient } from './config';

export interface StoreAgreement {
  _id: string;
  user: string;
  agreedAt: string;
  ipAddress: string;
  version: string;
  termsContent: string;
  accepted: boolean;
}

export interface StoreTerms {
  version: string;
  terms: string;
  updatedAt: string;
}

export interface StoreItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stockStatus: 'in_stock' | 'out_of_stock' | 'low_stock' | 'unlimited';
  imageURL?: string;
  isStoreItem: boolean;
  createdAt: string;
}

export interface StoreTransaction {
  totalSales: number;
  totalRevenue: number;
  recentTransactions: Array<{
    _id: string;
    name: string;
    price: number;
    buyerId: string;
    createdAt: string;
  }>;
}

export const storeAPI = {
  // Get Store Owner Terms
  getTerms: async (): Promise<StoreTerms> => {
    const response = await apiClient.get('/store/terms');
    return response.data.data;
  },

  // Activate Store Mode
  activateStoreMode: async (storeName: string, acceptTerms: boolean): Promise<any> => {
    const response = await apiClient.post('/store/activate', {
      storeName,
      acceptTerms
    });
    return response.data;
  },

  // Toggle Store Mode on/off
  toggleStoreMode: async (): Promise<{ storeMode: boolean }> => {
    const response = await apiClient.put('/store/toggle');
    return response.data.data;
  },

  // Get my store items
  getMyStoreItems: async (): Promise<StoreItem[]> => {
    const response = await apiClient.get('/store/my-store');
    return response.data.data;
  },

  // Get store transactions
  getTransactions: async (): Promise<StoreTransaction> => {
    const response = await apiClient.get('/store/transactions');
    return response.data.data;
  },

  // Get my store agreement
  getMyAgreement: async (): Promise<StoreAgreement> => {
    const response = await apiClient.get('/store/agreement');
    return response.data.data;
  }
};
