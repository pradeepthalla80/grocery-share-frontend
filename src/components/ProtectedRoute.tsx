import { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getToken } from '../utils/token';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const location = useLocation();
  const [authState, setAuthState] = useState<'checking' | 'verified' | 'no_token'>('checking');
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const verifyToken = async () => {
      // Only run once per mount
      if (verificationAttempted.current) return;
      verificationAttempted.current = true;

      const token = getToken();
      
      if (!token) {
        // No token stored - definitely not authenticated
        setAuthState('no_token');
        return;
      }

      // Token exists - wait for auth verification if not already authenticated
      if (!isAuthenticated && !isLoading) {
        try {
          await checkAuth();
        } catch (err) {
          console.log('ProtectedRoute: Auth verification failed');
        }
      }
      
      setAuthState('verified');
    };

    verifyToken();
  }, []);

  // Also update state when AuthContext finishes loading
  useEffect(() => {
    if (!isLoading && authState === 'checking') {
      const token = getToken();
      if (!token) {
        setAuthState('no_token');
      } else if (isAuthenticated) {
        setAuthState('verified');
      }
    }
  }, [isLoading, isAuthenticated, authState]);

  // Show loading while checking
  if (authState === 'checking' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // No token = redirect to login
  if (authState === 'no_token') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Token exists and verification complete
  // Allow access even if isAuthenticated is false (let page handle re-auth)
  // This prevents logout during transient issues
  return <>{children}</>;
};
