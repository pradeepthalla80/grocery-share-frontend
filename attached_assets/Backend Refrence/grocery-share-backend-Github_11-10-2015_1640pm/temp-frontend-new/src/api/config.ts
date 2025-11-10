import axios from 'axios';
import { getToken } from '../utils/token';

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://grocery-share-backend.onrender.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('grocery_share_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
