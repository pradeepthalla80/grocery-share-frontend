import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { getAccountStatus } from '../api/stripeConnect';

interface StripeCallbackProps {
  type: 'complete' | 'refresh';
}

export const StripeOnboardingCallback = ({ type }: StripeCallbackProps) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'incomplete' | 'error'>('loading');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        if (type === 'complete') {
          const data = await getAccountStatus();
          if (data.accountStatus?.chargesEnabled && data.accountStatus?.payoutsEnabled) {
            setStatus('success');
          } else if (data.accountStatus?.detailsSubmitted) {
            setStatus('incomplete');
          } else {
            setStatus('incomplete');
          }
        } else {
          setStatus('incomplete');
        }
      } catch {
        setStatus('error');
      }
    };
    checkStatus();
  }, [type]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Checking your account...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Stripe Setup Complete!</h2>
            <p className="text-sm text-gray-500 mb-6">Your account is fully set up. You can now receive payments for your items.</p>
            <button
              onClick={() => navigate('/my-store')}
              className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition"
            >
              Go to My Store
            </button>
          </>
        )}

        {status === 'incomplete' && (
          <>
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {type === 'refresh' ? 'Session Expired' : 'Setup Not Complete'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {type === 'refresh'
                ? 'Your onboarding session expired. Go to your store to try again.'
                : 'Your Stripe account needs more information. You can complete it from your store page.'}
            </p>
            <button
              onClick={() => navigate('/my-store')}
              className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition"
            >
              Go to My Store
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Something Went Wrong</h2>
            <p className="text-sm text-gray-500 mb-6">We couldn't verify your Stripe account. Please try again from your store page.</p>
            <button
              onClick={() => navigate('/my-store')}
              className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition"
            >
              Go to My Store
            </button>
          </>
        )}
      </div>
    </div>
  );
};
