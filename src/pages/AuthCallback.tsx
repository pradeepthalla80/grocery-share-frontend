import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile } from '../api/users';
import { saveToken } from '../utils/token';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');
        const userName = searchParams.get('name');
        const userEmail = searchParams.get('email');
        const userRole = searchParams.get('role');
        
        if (!token) {
          console.error('No token received from OAuth callback');
          setError('Authentication failed - no token received');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        console.log('Token received from Google OAuth');
        
        // Save token first so API calls can use it
        saveToken(token);
        
        let userData;
        
        // Try to fetch full user profile from backend
        try {
          console.log('Fetching user profile from /users/me...');
          const profileData = await getUserProfile();
          userData = {
            id: profileData.user?.id || profileData.id || userId || '',
            name: profileData.user?.name || profileData.name || userName || 'User',
            email: profileData.user?.email || profileData.email || userEmail || '',
            role: profileData.user?.role || profileData.role || userRole as any,
            googleId: profileData.user?.googleId || profileData.googleId,
            createdAt: profileData.user?.createdAt || profileData.createdAt,
          };
          console.log('User profile fetched successfully:', userData);
        } catch (profileError) {
          console.warn('Failed to fetch user profile, using URL params:', profileError);
          // Fallback to URL parameters if profile fetch fails
          userData = {
            id: userId || '',
            name: userName || 'User',
            email: userEmail || '',
            role: userRole as any,
          };
        }
        
        console.log('Final user data for login:', userData);
        
        // Login with user data
        login(token, userData);
        
        console.log('Login complete, redirecting to dashboard...');
        navigate('/dashboard');
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Failed to complete sign in');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-gray-600 mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Completing Google sign in...</p>
          </>
        )}
      </div>
    </div>
  );
};
