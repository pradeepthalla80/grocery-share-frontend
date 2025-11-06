interface User {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin' | 'super_admin';
  createdAt?: string;
  googleId?: string;
}

export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin' || user?.role === 'super_admin';
};

export const isSuperAdmin = (user: User | null): boolean => {
  return user?.role === 'super_admin';
};

export const hasAdminAccess = (user: User | null): boolean => {
  return isAdmin(user);
};

export const canDeleteAnyContent = (user: User | null): boolean => {
  return isAdmin(user);
};

export const canManageUsers = (user: User | null): boolean => {
  return isSuperAdmin(user);
};
