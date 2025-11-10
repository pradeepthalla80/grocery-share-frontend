const TOKEN_KEY = 'grocery_share_token';

// Helper to get cookie value
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
};

// Helper to set cookie
const setCookie = (name: string, value: string, days: number = 7): void => {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value}; max-age=${maxAge}; Secure; SameSite=Lax; path=/`;
};

// Helper to remove cookie
const removeCookie = (name: string): void => {
  document.cookie = `${name}=; max-age=0; path=/`;
};

// Save token with localStorage + cookie fallback
export const saveToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.warn('localStorage blocked, using cookie fallback:', e);
  }
  
  // Always set cookie as backup (for tracking prevention scenarios)
  setCookie(TOKEN_KEY, token, 7);
};

// Get token from localStorage or cookie fallback
export const getToken = (): string | null => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) return token;
  } catch (e) {
    console.warn('localStorage blocked, reading from cookie');
  }
  
  // Fallback to cookie
  return getCookie(TOKEN_KEY);
};

// Remove token from both localStorage and cookie
export const removeToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.warn('localStorage blocked during removal');
  }
  
  removeCookie(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};
