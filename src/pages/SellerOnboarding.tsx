import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  DollarSign,
  ArrowLeft,
  Home,
  RefreshCw
} from 'lucide-react';
import { stripeConnectAPI, SUPPORTED_COUNTRIES, type StripeAccountStatus } from '../api/stripeConnect';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

export const SellerOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { checkAuth, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);
  const [balance, setBalance] = useState<{ available: number; pending: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [authChecked, setAuthChecked] = useState(false);

  const isReturn = location.pathname.includes('/complete');
  const isRefresh = location.pathname.includes('/refresh');

  useEffect(() => {
    const revalidateAuth = async () => {
      if (isReturn || isRefresh) {
        try {
          await checkAuth();
        } catch (err) {
          console.error('Auth revalidation failed:', err);
        }
      }
      setAuthChecked(true);
    };
    revalidateAuth();
  }, [isReturn, isRefresh, checkAuth]);

  useEffect(() => {
    if (authChecked && isAuthenticated) {
      checkAccountStatus();
    }
  }, [authChecked, isAuthenticated]);

  useEffect(() => {
    if (authChecked && isAuthenticated) {
      if (isReturn) {
        showToast('Checking your account status...', 'info');
      }
      if (isRefresh) {
        showToast('Onboarding link expired. Please try again.', 'error');
      }
    }
  }, [isReturn, isRefresh, authChecked, isAuthenticated, showToast]);

  useEffect(() => {
    if (authChecked && isAuthenticated && isReturn) {
      const pendingItemData = sessionStorage.getItem('pendingItemData');
      if (pendingItemData) {
        showToast('Your item form has been saved. Return to Add Item to continue.', 'info');
      }
    }
  }, [authChecked, isAuthenticated, isReturn, showToast]);

  const checkAccountStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await stripeConnectAPI.getAccountStatus();
      
      setHasAccount(response.hasAccount);
      setAccountStatus(response.accountStatus || null);
      
      if (response.accountStatus?.status === 'active') {
        try {
          const balanceResponse = await stripeConnectAPI.getBalance();
          setBalance(balanceResponse.balance);
        } catch (err) {
          console.error('Failed to fetch balance:', err);
        }
      }
    } catch (err: any) {
      console.error('Failed to check account status:', err);
      setError(err.response?.data?.error || 'Failed to check account status');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      await stripeConnectAPI.createAccount(selectedCountry);
      
      const linkResponse = await stripeConnectAPI.createAccountLink();
      
      window.location.href = linkResponse.url;
    } catch (err: any) {
      console.error('Failed to create account:', err);
      setError(err.response?.data?.error || 'Failed to start onboarding');
      showToast('Failed to start onboarding', 'error');
      setActionLoading(false);
    }
  };

  const handleContinueOnboarding = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      const linkResponse = await stripeConnectAPI.createAccountLink();
      window.location.href = linkResponse.url;
    } catch (err: any) {
      console.error('Failed to get onboarding link:', err);
      setError(err.response?.data?.error || 'Failed to continue onboarding');
      showToast('Failed to continue onboarding', 'error');
      setActionLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      setActionLoading(true);
      const response = await stripeConnectAPI.createDashboardLink();
      window.open(response.url, '_blank');
    } catch (err: any) {
      console.error('Failed to open dashboard:', err);
      showToast('Failed to open Stripe dashboard', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnToAddItem = () => {
    const pendingItemData = sessionStorage.getItem('pendingItemData');
    if (pendingItemData) {
      navigate('/add-item?restore=true');
    } else {
      navigate('/add-item');
    }
  };

  const getStatusDisplay = () => {
    if (!accountStatus) return null;
    
    switch (accountStatus.status) {
      case 'active':
        return (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Account Active - Ready to receive payments</span>
          </div>
        );
      case 'pending_verification':
        return (
          <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-medium">Verification in progress</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Onboarding incomplete</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (authLoading || !authChecked || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {authLoading || !authChecked ? 'Verifying your session...' : 'Loading seller account status...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium"
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-100 p-3 rounded-lg">
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Seller Payment Setup</h1>
              <p className="text-gray-600">Connect your bank account to receive payments</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {hasAccount && accountStatus && (
            <div className="mb-6">
              {getStatusDisplay()}
            </div>
          )}

          {!hasAccount && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Why connect with Stripe?</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Receive payments directly to your bank account</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Secure and fast payouts (typically 2-3 business days)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Track your earnings and manage payouts</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>BaskMate takes only 10% commission</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Valid government ID</li>
                  <li>Bank account or debit card for payouts</li>
                  <li>Takes about 5 minutes to complete</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Country
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {SUPPORTED_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  This determines where your payouts will be sent
                </p>
              </div>

              <button
                onClick={handleCreateAccount}
                disabled={actionLoading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Starting Setup...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Set Up Seller Account</span>
                  </>
                )}
              </button>
            </div>
          )}

          {hasAccount && accountStatus?.status === 'pending' && (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-2">Complete Your Setup</h3>
                <p className="text-sm text-orange-800">
                  You started setting up your seller account but haven't finished. 
                  Complete the setup to start receiving payments.
                </p>
                {accountStatus.requirements.currentlyDue.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-orange-700 font-medium">Remaining requirements:</p>
                    <ul className="text-xs text-orange-600 mt-1">
                      {accountStatus.requirements.currentlyDue.slice(0, 3).map((req, i) => (
                        <li key={i}>{req.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={handleContinueOnboarding}
                disabled={actionLoading}
                className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-5 w-5" />
                    <span>Continue Setup</span>
                  </>
                )}
              </button>
            </div>
          )}

          {hasAccount && accountStatus?.status === 'active' && (
            <div className="space-y-6">
              {balance && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-700 mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm font-medium">Available</span>
                    </div>
                    <p className="text-2xl font-bold text-green-800">
                      ${balance.available.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-blue-700 mb-1">
                      <Loader2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-800">
                      ${balance.pending.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">You're all set!</h3>
                <p className="text-sm text-green-800">
                  Your seller account is active. When customers buy your items, 
                  you'll receive 90% of the sale directly to your connected bank account.
                </p>
              </div>

              {sessionStorage.getItem('pendingItemData') && (
                <button
                  onClick={handleReturnToAddItem}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Return to Add Item</span>
                </button>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={handleOpenDashboard}
                  disabled={actionLoading}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <ExternalLink className="h-5 w-5" />
                  <span>Open Stripe Dashboard</span>
                </button>
                <button
                  onClick={checkAccountStatus}
                  disabled={loading}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {hasAccount && accountStatus?.status === 'pending_verification' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Verification in Progress</h3>
                <p className="text-sm text-yellow-800">
                  Stripe is reviewing your information. This usually takes 1-2 business days.
                  You'll be able to receive payments once verification is complete.
                </p>
              </div>

              <button
                onClick={checkAccountStatus}
                disabled={loading}
                className="w-full bg-yellow-600 text-white py-3 px-6 rounded-lg hover:bg-yellow-700 transition font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                <span>Check Status</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Payments are processed securely by Stripe.</p>
          <p className="mt-1">BaskMate commission: 10% per sale</p>
        </div>
      </div>
    </div>
  );
};
