import { apiClient } from './config';

export const createPaymentIntent = async (itemId: string) => {
  const response = await apiClient.post('/payment/create-payment-intent', { itemId });
  return response.data;
};

export const confirmPayment = async (paymentIntentId: string) => {
  const response = await apiClient.post('/payment/confirm-payment', { paymentIntentId });
  return response.data;
};

export const getStripePublishableKey = async () => {
  const response = await apiClient.get('/payment/config');
  return response.data;
};
