import { useAuth } from './useAuth';
import { isAdmin, isSuperAdmin, hasAdminAccess, canDeleteAnyContent, canManageUsers } from '../utils/adminUtils';

export const useAdmin = () => {
  const { user } = useAuth();

  return {
    isAdmin: isAdmin(user),
    isSuperAdmin: isSuperAdmin(user),
    hasAdminAccess: hasAdminAccess(user),
    canDeleteAnyContent: canDeleteAnyContent(user),
    canManageUsers: canManageUsers(user),
  };
};
