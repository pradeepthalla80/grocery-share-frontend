import axios from 'axios';
import { getToken, removeToken } from '../utils/token';

export const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'https://grocery-share-backend.onrender.com') + '/api/v1';

let toastCallback: ((message: string, type: 'success' | 'error' | 'info') => void) | null = null;
let authCheckCallback: (() => Promise<void>) | null = null;

// Track 401 retry attempts to prevent infinite loops
let retryCount = 0;
const MAX_RETRIES = 1;
let isRefreshingAuth = false;

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
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor to add Authorization header for mobile browser compatibility
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    // Reset retry count on successful response
    retryCount = 0;
    return response;
  },
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
      
      // List of paths that should NOT trigger auth clearing on 401
      const skipAuthClearPaths = [
        '/auth/google/callback',
        '/auth/callback',
        '/auth/google',
        '/auth/me',
        '/login',
        '/register',
        '/seller/onboarding',
        '/terms-acceptance',
      ];
      
      // Skip 401 handling for OAuth callback flow and onboarding returns
      const shouldSkip = skipAuthClearPaths.some(path => 
        currentPath.includes(path) || requestUrl.includes(path)
      );
      
      if (shouldSkip) {
        return Promise.reject(error);
      }
      
      // Prevent multiple simultaneous auth refreshes
      if (isRefreshingAuth) {
        return Promise.reject(error);
      }
      
      // Only attempt re-auth check once per session
      if (retryCount >= MAX_RETRIES) {
        // Max retries reached - clear token but DON'T force logout
        // Let the component handle the error gracefully
        console.log('401 error: Max retries reached, clearing local token');
        removeToken();
        return Promise.reject(error);
      }
      
      retryCount++;
      isRefreshingAuth = true;
      
      // For other 401s, try to re-verify auth silently
      if (authCheckCallback) {
        try {
          await authCheckCallback();
          isRefreshingAuth = false;
          // Auth check succeeded - user is still logged in
          // The original request already failed, so we still reject
          // but auth state is preserved
        } catch {
          isRefreshingAuth = false;
          // Auth check failed - session truly expired
          // But don't force redirect, let ProtectedRoute handle it
          console.log('401 error: Auth check failed, session expired');
        }
      } else {
        isRefreshingAuth = false;
      }
    }

    return Promise.reject(error);
  }
);

// Export a function to reset retry count (useful after successful login)
export const resetAuthRetryCount = () => {
  retryCount = 0;
  isRefreshingAuth = false;
};
