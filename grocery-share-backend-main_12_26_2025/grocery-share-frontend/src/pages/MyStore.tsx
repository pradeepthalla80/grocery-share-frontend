import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/config';
import { useToast } from '../hooks/useToast';
import {
  ArrowLeft, Store, Package, TrendingUp, Settings,
  CreditCard, ExternalLink, DollarSign, CheckCircle, AlertCircle, Loader2, ChevronRight
} from 'lucide-react';
import {
  createConnectedAccount, createAccountLink,
  getAccountStatus, createDashboardLink, getSellerBalance
} from '../api/stripeConnect';

const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' }, { code: 'BE', name: 'Belgium' },
  { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' },
  { code: 'IE', name: 'Ireland' }, { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' }, { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' },
  { code: 'NZ', name: 'New Zealand' }, { code: 'SG', name: 'Singapore' },
  { code: 'JP', name: 'Japan' }, { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' }, { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' }, { code: 'FI', name: 'Finland' },
  { code: 'PT', name: 'Portugal' }, { code: 'PL', name: 'Poland' },
];

export const MyStore = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeActionLoading, setStripeActionLoading] = useState(false);
  const [balance, setBalance] = useState<any>(null);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  useEffect(() => {
    const fetchStoreItems = async () => {
      try {
        const response = await apiClient.get('/store/my-store');
        setStoreItems(response.data.items || []);
      } catch (err) {
        console.error('Failed to fetch store items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreItems();
  }, []);

  useEffect(() => {
    if (!user?.isStoreOwner) return;
    const fetchStripeStatus = async () => {
      try {
        const data = await getAccountStatus();
        setStripeStatus(data);
        if (data.hasAccount && data.accountStatus?.chargesEnabled) {
          try {
            const balanceData = await getSellerBalance();
            setBalance(balanceData.balance);
          } catch (err) {
            console.error('Failed to fetch balance:', err);
          }
        }
      } catch (err) {
        console.error('Failed to fetch Stripe status:', err);
      } finally {
        setStripeLoading(false);
      }
    };
    fetchStripeStatus();
  }, [user?.isStoreOwner]);

  const handleCreateAccount = async () => {
    try {
      setStripeActionLoading(true);
      await createConnectedAccount(selectedCountry);
      const linkData = await createAccountLink();
      if (linkData.url) {
        window.open(linkData.url, '_blank');
      }
      showToast('Stripe account created! Complete your onboarding in the new tab.', 'success');
      const data = await getAccountStatus();
      setStripeStatus(data);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create Stripe account', 'error');
    } finally {
      setStripeActionLoading(false);
      setShowCountryPicker(false);
    }
  };

  const handleContinueOnboarding = async () => {
    try {
      setStripeActionLoading(true);
      const linkData = await createAccountLink();
      if (linkData.url) {
        window.open(linkData.url, '_blank');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create onboarding link', 'error');
    } finally {
      setStripeActionLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      setStripeActionLoading(true);
      const data = await createDashboardLink();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to open Stripe dashboard', 'error');
    } finally {
      setStripeActionLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setStripeLoading(true);
      const data = await getAccountStatus();
      setStripeStatus(data);
      if (data.hasAccount && data.accountStatus?.chargesEnabled) {
        try {
          const balanceData = await getSellerBalance();
          setBalance(balanceData.balance);
        } catch (err) {
          console.error('Failed to fetch balance:', err);
        }
      }
      showToast('Status refreshed', 'success');
    } catch (err: any) {
      showToast('Failed to refresh status', 'error');
    } finally {
      setStripeLoading(false);
    }
  };

  if (!user?.isStoreOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Store className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Store Mode Not Active</h2>
          <p className="text-sm text-gray-500 mb-4">You need to activate store mode to access this page.</p>
          <button
            onClick={() => navigate('/store-setup')}
            className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition"
          >
            Become a Store Owner
          </button>
        </div>
      </div>
    );
  }

  const renderStripeSection = () => {
    if (stripeLoading) {
      return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-3 w-24" />
            </div>
          </div>
        </div>
      );
    }

    if (!stripeStatus?.hasAccount) {
      return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4 md:mb-6">
          <div className="p-4 md:p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Set Up Payments</h3>
                <p className="text-xs text-gray-500">Connect with Stripe to receive payments</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              To sell items on BaskMate, you need a Stripe account. It takes just a few minutes to set up and you'll be able to receive payments directly to your bank account.
            </p>

            {!showCountryPicker ? (
              <button
                onClick={() => setShowCountryPicker(true)}
                disabled={stripeActionLoading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Connect with Stripe
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Select your country</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {SUPPORTED_COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCountryPicker(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium active:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAccount}
                    disabled={stripeActionLoading}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {stripeActionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Continue
                        <ExternalLink className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    const status = stripeStatus.accountStatus;
    const isActive = status?.chargesEnabled && status?.payoutsEnabled;
    const isPending = status?.detailsSubmitted && !isActive;
    const needsInfo = !status?.detailsSubmitted;

    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4 md:mb-6">
        <div className="p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isActive ? 'bg-green-100' : isPending ? 'bg-yellow-100' : 'bg-orange-100'
              }`}>
                <CreditCard className={`h-5 w-5 ${
                  isActive ? 'text-green-600' : isPending ? 'text-yellow-600' : 'text-orange-600'
                }`} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Stripe Payments</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isActive ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">Active</span>
                    </>
                  ) : isPending ? (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                      <span className="text-xs text-yellow-600 font-medium">Pending Verification</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                      <span className="text-xs text-orange-600 font-medium">Setup Incomplete</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleRefreshStatus}
              disabled={stripeLoading}
              className="text-xs text-blue-600 font-medium active:text-blue-700"
            >
              Refresh
            </button>
          </div>

          {isActive && balance && (
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-[10px] text-green-700 font-medium">Available</span>
                </div>
                <p className="text-lg font-bold text-green-800">
                  ${balance.available?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-[10px] text-blue-700 font-medium">Pending</span>
                </div>
                <p className="text-lg font-bold text-blue-800">
                  ${balance.pending?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          )}

          {isActive && (
            <button
              onClick={handleOpenDashboard}
              disabled={stripeActionLoading}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl active:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Open Stripe Dashboard</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          )}

          {(needsInfo || isPending) && (
            <div className="space-y-2.5">
              {needsInfo && (
                <p className="text-xs text-orange-700 bg-orange-50 rounded-lg p-2.5 border border-orange-100">
                  Your Stripe account needs more information before you can accept payments. Click below to continue setup.
                </p>
              )}
              {isPending && (
                <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg p-2.5 border border-yellow-100">
                  Your information has been submitted and is being verified by Stripe. This usually takes 1-2 business days.
                </p>
              )}
              {needsInfo && (
                <button
                  onClick={handleContinueOnboarding}
                  disabled={stripeActionLoading}
                  className="w-full bg-orange-600 text-white py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {stripeActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Complete Stripe Setup
                      <ExternalLink className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="hidden md:flex mb-6 items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-5 md:p-6 text-white mb-4 md:mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{user?.storeName || 'My Store'}</h1>
                <p className="text-purple-200 text-sm">Store Owner Dashboard</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4 md:mb-6">
          <div className="bg-white rounded-xl p-3 md:p-4 text-center border border-gray-100">
            <Package className="h-5 w-5 mx-auto text-purple-600 mb-1" />
            <p className="text-lg md:text-xl font-bold text-gray-900">{storeItems.length}</p>
            <p className="text-[10px] md:text-xs text-gray-500">Products</p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 text-center border border-gray-100">
            <TrendingUp className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-lg md:text-xl font-bold text-gray-900">-</p>
            <p className="text-[10px] md:text-xs text-gray-500">Sales</p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 text-center border border-gray-100">
            <Settings className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <p className="text-lg md:text-xl font-bold text-gray-900">Active</p>
            <p className="text-[10px] md:text-xs text-gray-500">Status</p>
          </div>
        </div>

        {renderStripeSection()}

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Store Items</h2>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="skeleton w-16 h-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : storeItems.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium mb-1">No store items yet</p>
              <p className="text-sm text-gray-400 mb-4">Add items to your store inventory</p>
              <button
                onClick={() => navigate('/add-item')}
                className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition"
              >
                Add Store Item
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {storeItems.map((item: any) => (
                <div
                  key={item._id || item.id}
                  onClick={() => navigate(`/item/${item._id || item.id}`)}
                  className="flex items-center gap-3 p-3 md:p-4 active:bg-gray-50 transition cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.images?.[0] || item.imageURL ? (
                      <img src={item.images?.[0] || item.imageURL} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="h-5 w-5 text-gray-300" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.isFree ? 'Free' : `$${item.price?.toFixed(2)}`}</p>
                  </div>
                  <div className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                    Store
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
