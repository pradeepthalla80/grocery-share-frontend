import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { saveToken, getToken, removeToken } from '../utils/token';
import { apiClient } from '../api/config';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  googleId?: string;
  role?: 'user' | 'admin' | 'super_admin';
  isStoreOwner?: boolean;
  storeMode?: boolean;
  storeName?: string;
  storeAgreementAccepted?: boolean;
  storeActivatedAt?: string;
}

export interface AuthContextType {
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

  useEffect(() => {
    const token = getToken();
    if (token) {
      const storedUser = localStorage.getItem('grocery_share_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    saveToken(token);
    localStorage.setItem('grocery_share_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    removeToken();
    localStorage.removeItem('grocery_share_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const checkAuth = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await apiClient.get('/auth/me');
      const userData = response.data.user || response.data;
      localStorage.setItem('grocery_share_user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    } catch {
      logout();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
