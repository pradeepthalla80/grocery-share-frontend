import { apiClient } from './config';

export interface StripeAccountStatus {
  status: 'pending' | 'pending_verification' | 'active' | 'disabled' | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pendingVerification: string[];
  };
}

export interface AccountStatusResponse {
  success: boolean;
  hasAccount: boolean;
  accountId?: string;
  accountStatus?: StripeAccountStatus;
}

export interface BalanceResponse {
  success: boolean;
  balance: {
    available: number;
    pending: number;
    currency: string;
  };
}

// Supported countries for Stripe Connect Express
export const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MT', name: 'Malta' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
];

export const stripeConnectAPI = {
  // Create a new Stripe Express connected account
  createAccount: async (country: string = 'US'): Promise<{ success: boolean; accountId: string; message: string }> => {
    const response = await apiClient.post('/stripe-connect/create-account', { country });
    return response.data;
  },

  // Create an account link for onboarding
  createAccountLink: async (): Promise<{ success: boolean; url: string; expiresAt: number }> => {
    const response = await apiClient.post('/stripe-connect/create-account-link');
    return response.data;
  },

  // Get connected account status
  getAccountStatus: async (): Promise<AccountStatusResponse> => {
    const response = await apiClient.get('/stripe-connect/account-status');
    return response.data;
  },

  // Create a login link to Stripe Express dashboard
  createDashboardLink: async (): Promise<{ success: boolean; url: string }> => {
    const response = await apiClient.post('/stripe-connect/dashboard-link');
    return response.data;
  },

  // Get seller's balance/earnings
  getBalance: async (): Promise<BalanceResponse> => {
    const response = await apiClient.get('/stripe-connect/balance');
    return response.data;
  },
};
