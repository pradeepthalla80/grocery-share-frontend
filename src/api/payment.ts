import { apiClient } from './config';

export const createPaymentIntent = async (itemId: string, includeDelivery: boolean = false) => {
  const response = await apiClient.post('/payment/create-payment-intent', { itemId, includeDelivery });
  return response.data;
};

export const confirmPayment = async (paymentIntentId: string) => {
  const response = await apiClient.post('/payment/confirm-payment', { paymentIntentId });
  return response.data;
};

export const requestRefund = async (itemId: string, reason: string) => {
  const response = await apiClient.post('/payment/request-refund', { itemId, reason });
  return response.data;
};

export const getStripePublishableKey = async () => {
  const response = await apiClient.get('/payment/config');
  return response.data;
};
