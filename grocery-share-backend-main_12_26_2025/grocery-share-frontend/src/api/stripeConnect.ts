import { apiClient } from './config';

export const createConnectedAccount = async (country: string) => {
  const response = await apiClient.post('/stripe-connect/create-account', { country });
  return response.data;
};

export const createAccountLink = async () => {
  const response = await apiClient.post('/stripe-connect/create-account-link');
  return response.data;
};

export const getAccountStatus = async () => {
  const response = await apiClient.get('/stripe-connect/account-status');
  return response.data;
};

export const createDashboardLink = async () => {
  const response = await apiClient.post('/stripe-connect/dashboard-link');
  return response.data;
};

export const getSellerBalance = async () => {
  const response = await apiClient.get('/stripe-connect/balance');
  return response.data;
};
