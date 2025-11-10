import axios from 'axios';
import { getToken } from '../utils/token';

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://grocery-share-backend.onrender.com';

let toastCallback: ((message: string, type: 'success' | 'error' | 'info') => void) | null = null;

export const setToastCallback = (callback: (message: string, type: 'success' | 'error' | 'info') => void) => {
  toastCallback = callback;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
  withCredentials: true, // Send cookies with every request
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Cookies are now sent automatically via withCredentials: true
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('grocery_share_token');
      if (toastCallback) {
        toastCallback('Session expired. Please login again.', 'error');
      }
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      return Promise.reject(error);
    }

    // Handle network errors
    if (error.code === 'ERR_NETWORK' || !error.response) {
      if (toastCallback) {
        toastCallback('Network error. Please check your connection.', 'error');
      }
      return Promise.reject(error);
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      if (toastCallback) {
        toastCallback('Request timed out. Please try again.', 'error');
      }
      return Promise.reject(error);
    }

    // Handle server errors (500+)
    if (error.response?.status >= 500) {
      if (toastCallback) {
        toastCallback('Server error. Please try again later.', 'error');
      }
      return Promise.reject(error);
    }

    // For other errors, let the specific API call handle them
    return Promise.reject(error);
  }
);
