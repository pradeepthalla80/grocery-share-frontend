import { apiClient } from './config';

export const deleteAccount = async (confirmPassword?: string) => {
  const response = await apiClient.delete('/users/me', {
    data: { confirmPassword }
  });
  return response.data;
};

export const getUserProfile = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};
