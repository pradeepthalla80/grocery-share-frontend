import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient, setAuthCheckCallback } from '../api/config';
import { saveToken, removeToken } from '../utils/token';

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

  // Check authentication by calling /me endpoint
  // HttpOnly cookie is automatically sent via withCredentials: true
  const checkAuth = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      console.log('Auth check failed:', error.response?.status);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    // Register checkAuth callback for interceptor to use on 401 errors
    setAuthCheckCallback(checkAuth);
  }, []);

  const login = (token: string, userData: User) => {
    // Save token to localStorage for mobile browser compatibility
    // HttpOnly cookie is still used as primary auth, this is fallback for mobile
    saveToken(token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      // Call backend to clear HttpOnly cookie
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage token
      removeToken();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
