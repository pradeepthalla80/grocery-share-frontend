import { apiClient } from './config';

export const revealAddress = async (conversationId: string) => {
  const response = await apiClient.post(`/address/reveal/${conversationId}`);
  return response.data;
};
