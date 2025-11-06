import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
        
        if (!token) {
          console.error('No token received from OAuth callback');
          setError('Authentication failed - no token received');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        console.log('Token received from Google OAuth');
        
        // Create user object from URL parameters
        const userData = {
          id: userId || '',
          name: userName || 'User',
          email: userEmail || '',
        };
        
        console.log('User data from OAuth:', userData);
        
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
