import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { saveToken, getToken, removeToken } from '../utils/token';

interface User {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin' | 'super_admin';
  createdAt?: string;
  googleId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for user data storage (localStorage + cookie fallback)
const USER_KEY = 'grocery_share_user';

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
};

const setCookie = (name: string, value: string, days: number = 7): void => {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; Secure; SameSite=Lax; path=/`;
};

const removeCookie = (name: string): void => {
  document.cookie = `${name}=; max-age=0; path=/`;
};

const saveUserData = (userData: User): void => {
  const jsonData = JSON.stringify(userData);
  
  try {
    localStorage.setItem(USER_KEY, jsonData);
  } catch (e) {
    console.warn('localStorage blocked, using cookie for user data');
  }
  
  // Always set cookie as backup
  setCookie(USER_KEY, jsonData, 7);
};

const getUserData = (): User | null => {
  try {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) return JSON.parse(storedUser);
  } catch (e) {
    console.warn('localStorage blocked, reading user data from cookie');
  }
  
  // Fallback to cookie
  const cookieData = getCookie(USER_KEY);
  if (cookieData) {
    try {
      return JSON.parse(decodeURIComponent(cookieData));
    } catch (e) {
      console.error('Failed to parse user data from cookie:', e);
    }
  }
  
  return null;
};

const removeUserData = (): void => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.warn('localStorage blocked during user data removal');
  }
  
  removeCookie(USER_KEY);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const storedUser = getUserData();
      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    saveToken(token);
    saveUserData(userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    removeToken();
    removeUserData();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
