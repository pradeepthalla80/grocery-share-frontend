import axios from 'axios';
import { getToken } from '../utils/token';

export const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'https://grocery-share-backend.onrender.com') + '/api/v1';

let toastCallback: ((message: string, type: 'success' | 'error' | 'info') => void) | null = null;
let authCheckCallback: (() => Promise<void>) | null = null;

export const setToastCallback = (callback: (message: string, type: 'success' | 'error' | 'info') => void) => {
  toastCallback = callback;
};

export const setAuthCheckCallback = (callback: () => Promise<void>) => {
  authCheckCallback = callback;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
  withCredentials: true, // Send HttpOnly cookies automatically with every request
});

// Request interceptor to add Authorization header for mobile browser compatibility
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (fallback for mobile browsers that block cookies)
    const token = getToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // FIX: Remove Content-Type header for FormData uploads
    // Let browser set correct multipart/form-data boundary automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
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

    // Handle 401 errors (session expiry) intelligently
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const currentPath = window.location.pathname;
      
      // Skip 401 handling for OAuth callback flow
      if (currentPath.includes('/auth/google/callback') || 
          currentPath.includes('/auth/callback') ||
          requestUrl.includes('/auth/google')) {
        return Promise.reject(error);
      }
      
      // Skip 401 handling for /auth/me - let AuthContext handle initial check
      if (requestUrl.includes('/auth/me')) {
        return Promise.reject(error);
      }
      
      // Skip 401 handling during login/register flows
      if (currentPath === '/login' || currentPath === '/register') {
        return Promise.reject(error);
      }
      
      // For all other 401s (mid-session expiry), trigger re-auth check
      // This handles cases where backend clears session or cookie expires
      if (authCheckCallback) {
        try {
          await authCheckCallback();
        } catch {
          // If checkAuth fails, it will clear auth state and ProtectedRoute will redirect
        }
      }
    }

    return Promise.reject(error);
  }
);
