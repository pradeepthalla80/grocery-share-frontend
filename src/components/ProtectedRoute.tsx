import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getToken } from '../utils/token';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Paths that might return from external redirects (Stripe, OAuth, etc.)
  const externalReturnPaths = [
    '/seller/onboarding/complete',
    '/seller/onboarding/refresh',
    '/seller/onboarding',
    '/auth/google/callback',
    '/auth/callback',
  ];

  const isExternalReturn = externalReturnPaths.some(path => 
    location.pathname.includes(path)
  );

  useEffect(() => {
    const verifyAuth = async () => {
      // If we have a token but aren't authenticated yet, verify
      const token = getToken();
      
      if (token && !isAuthenticated && !isLoading && !hasChecked) {
        setIsVerifying(true);
        try {
          await checkAuth();
        } catch (err) {
          console.error('Auth verification failed:', err);
        } finally {
          setIsVerifying(false);
          setHasChecked(true);
        }
      } else if (!token) {
        setHasChecked(true);
      }
    };

    verifyAuth();
  }, [isAuthenticated, isLoading, hasChecked, checkAuth]);

  // Show loading while initial auth check or verification is in progress
  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  // If we have a token but not authenticated yet on external return paths, wait
  const token = getToken();
  if (token && !isAuthenticated && isExternalReturn && !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Restoring your session...</p>
        </div>
      </div>
    );
  }

  // Only redirect to login if no token exists
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  // If we have a token but verification failed, still allow access
  // The individual page will handle re-verification
  if (token && !isAuthenticated) {
    return <>{children}</>;
  }

  return <>{children}</>;
};
