import React, { createContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { apiClient, setAuthCheckCallback, resetAuthRetryCount } from '../api/config';
import { saveToken, removeToken, getToken } from '../utils/token';

interface User {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin' | 'super_admin';
  createdAt?: string;
  googleId?: string;
  isStoreOwner?: boolean;
  storeMode?: boolean;
  storeName?: string;
  storeAgreementAccepted?: boolean;
  storeActivatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isCheckingAuth = useRef(false);
  const lastAuthCheck = useRef<number>(0);
  const AUTH_CHECK_COOLDOWN = 2000; // 2 seconds cooldown between auth checks

  const checkAuth = async () => {
    // Prevent multiple simultaneous auth checks
    if (isCheckingAuth.current) {
      return;
    }
    
    // Cooldown to prevent rapid repeated checks
    const now = Date.now();
    if (now - lastAuthCheck.current < AUTH_CHECK_COOLDOWN) {
      return;
    }
    
    isCheckingAuth.current = true;
    lastAuthCheck.current = now;
    
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        // Only clear auth if we got an explicit "not authenticated" response
        // AND there's no token stored (prevents clearing during transient issues)
        const token = getToken();
        if (!token) {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error: any) {
      console.log('Auth check failed:', error.response?.status);
      
      // Only clear auth state if:
      // 1. We get an explicit 401/403 AND
      // 2. There's no stored token (meaning it wasn't just a transient issue)
      const status = error.response?.status;
      const token = getToken();
      
      if ((status === 401 || status === 403) && !token) {
        setUser(null);
        setIsAuthenticated(false);
      }
      // For network errors or other issues, preserve current auth state
      // This prevents logout during temporary connectivity issues
    } finally {
      setIsLoading(false);
      isCheckingAuth.current = false;
    }
  };

  useEffect(() => {
    checkAuth();
    setAuthCheckCallback(checkAuth);
  }, []);

  const login = (token: string, userData: User) => {
    saveToken(token);
    setUser(userData);
    setIsAuthenticated(true);
    resetAuthRetryCount(); // Reset retry count after successful login
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeToken();
      setUser(null);
      setIsAuthenticated(false);
      resetAuthRetryCount();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
