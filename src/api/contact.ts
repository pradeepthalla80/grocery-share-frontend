import { apiClient } from './config';

export const submitContactForm = async (data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) => {
  const response = await apiClient.post('/contact', data);
  return response.data;
};
