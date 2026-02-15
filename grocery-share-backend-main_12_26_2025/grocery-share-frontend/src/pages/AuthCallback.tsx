import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile } from '../api/users';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          console.error('No token received from OAuth callback');
          navigate('/login');
          return;
        }

        console.log('Token received, fetching user profile...');
        
        // Save token temporarily to make API request
        localStorage.setItem('grocery_share_token', token);
        
        // Fetch full user profile
        const userData = await getUserProfile();
        
        console.log('User profile fetched:', userData);
        
        // Login with full user data
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
