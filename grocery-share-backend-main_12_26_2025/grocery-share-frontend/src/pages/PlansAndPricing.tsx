import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { miniStoreAPI } from '../api/miniStore';
import { ArrowLeft, Check, Crown, Store, Sparkles, Clock, Loader2, AlertCircle } from 'lucide-react';

type StoreStatus = 'idle' | 'checking' | 'available' | 'approval_required' | 'pending_approval' | 'waitlist_only' | 'zip_blocked' | 'zip_paused' | 'zip_full' | 'globally_disabled' | 'waitlisted' | 'requested' | 'error';

export const PlansAndPricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [zipCode, setZipCode] = useState('');
  const [storeStatus, setStoreStatus] = useState<StoreStatus>('idle');
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const checkMiniStoreAvailability = async () => {
    if (!zipCode || zipCode.length < 5) return;
    try {
      setStoreStatus('checking');
      const result = await miniStoreAPI.checkAvailability(zipCode);
      setWaitlistOpen(result.waitlistOpen);
      if (result.available) {
        setStoreStatus(result.reason === 'approval_required' ? 'approval_required' : 'available');
      } else {
        const statusMap: Record<string, StoreStatus> = {
          'globally_disabled': 'globally_disabled',
          'zip_blocked': 'zip_blocked',
          'zip_paused': 'zip_paused',
          'waitlist_only': 'waitlist_only',
          'pending_approval': 'pending_approval',
          'zip_full': 'zip_full',
        };
        setStoreStatus(statusMap[result.reason] || 'zip_blocked');
      }
    } catch {
      setStoreStatus('error');
    }
  };

  const handleJoinWaitlist = async () => {
    try {
      setActionLoading(true);
      await miniStoreAPI.joinWaitlist(zipCode, user?.email);
      setStoreStatus('waitlisted');
    } catch {
      setStoreStatus('error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    try {
      setActionLoading(true);
      await miniStoreAPI.submitStoreRequest({ zipCode });
      setStoreStatus('requested');
    } catch {
      setStoreStatus('error');
    } finally {
      setActionLoading(false);
    }
  };

  const freeTierFeatures = [
    'List items locally',
    'Browse & purchase nearby',
    'Messaging & pickup coordination',
    'No upfront fees',
  ];

  const plusFeatures = [
    'Reduced transaction fees',
    'Priority listing visibility',
    'Seller insights & analytics',
    'Trust badge',
  ];

  const storeFeatures = [
    'Store profile & branding',
    'Product catalog & inventory tools',
    'Bulk listing tools',
    'Scheduled pickups & subscriptions',
    'Enhanced visibility',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-500 active:text-gray-700 mb-4 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Plans & Pricing</h1>
          <p className="text-sm text-gray-500 mt-1.5">Transparent pricing. A small service fee applies only when a sale is completed.</p>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Free Membership</h2>
                <p className="text-2xl font-bold text-green-600 mt-0.5">Free</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <ul className="space-y-2 mb-4">
              {freeTierFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
              Service Fee: <span className="font-semibold text-gray-800">5–8%</span> per sale
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-green-300 p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">BaskMate Plus</h2>
                <p className="text-2xl font-bold text-green-600 mt-0.5">$4.99<span className="text-sm font-normal text-gray-500">/month</span></p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Crown className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <ul className="space-y-2 mb-4">
              {plusFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Sparkles className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="bg-green-50 rounded-lg px-3 py-2 text-xs text-green-700 mb-3">
              Service Fee: <span className="font-semibold text-green-800">~3–5%</span> per sale
            </div>
            <button className="w-full py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition shadow-sm">
              Upgrade to Plus
            </button>
          </div>

          <div className="bg-white rounded-2xl border-2 border-purple-300 p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">PRO</div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Mini Store</h2>
                <p className="text-2xl font-bold text-purple-600 mt-0.5">$19.99<span className="text-sm font-normal text-gray-500">/month</span></p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Store className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">For frequent sellers & home-based businesses</p>
            <ul className="space-y-2 mb-4">
              {storeFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="bg-purple-50 rounded-lg px-3 py-2 text-xs text-purple-700 mb-3">
              Service Fee: <span className="font-semibold text-purple-800">~2–4%</span> per sale
            </div>

            <div className="border-t border-gray-100 pt-3 mt-1">
              <p className="text-[11px] text-gray-400 mb-3 flex items-start gap-1">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Mini Store availability may be limited by area to protect seller success.
              </p>

              {user?.isStoreOwner ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  You have an active Mini Store
                </div>
              ) : (
                <>
                  {storeStatus === 'idle' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        placeholder="Enter ZIP code"
                        className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        maxLength={5}
                      />
                      <button
                        onClick={checkMiniStoreAvailability}
                        disabled={zipCode.length < 5}
                        className="px-4 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition disabled:opacity-50"
                      >
                        Check
                      </button>
                    </div>
                  )}

                  {storeStatus === 'checking' && (
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking availability...
                    </div>
                  )}

                  {storeStatus === 'available' && (
                    <button
                      onClick={() => navigate('/store-setup')}
                      className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition shadow-sm"
                    >
                      Open Mini Store
                    </button>
                  )}

                  {storeStatus === 'approval_required' && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Your area requires approval to open a Mini Store.</p>
                      <button
                        onClick={handleSubmitRequest}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Submit Store Request
                      </button>
                    </div>
                  )}

                  {storeStatus === 'pending_approval' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Your Mini Store request is under review.
                    </div>
                  )}

                  {(storeStatus === 'waitlist_only' || storeStatus === 'zip_paused' || storeStatus === 'zip_full' || storeStatus === 'globally_disabled') && waitlistOpen && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">
                        Mini Store availability is currently limited in your area. Join the waitlist to be notified when space becomes available.
                      </p>
                      <button
                        onClick={handleJoinWaitlist}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Join Waitlist
                      </button>
                    </div>
                  )}

                  {(storeStatus === 'zip_blocked' || (storeStatus === 'zip_full' && !waitlistOpen)) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-600">
                      {storeStatus === 'zip_full' ? 'All Mini Store slots in your area are currently taken.' : 'Mini Store is not available in your area at this time.'}
                    </div>
                  )}

                  {(storeStatus === 'globally_disabled' && !waitlistOpen) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-600">
                      Mini Store is not available at this time.
                    </div>
                  )}

                  {storeStatus === 'waitlisted' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      You've been added to the waitlist. We'll notify you when space opens up.
                    </div>
                  )}

                  {storeStatus === 'requested' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Your Mini Store request has been submitted for review.
                    </div>
                  )}

                  {storeStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                      Something went wrong. Please try again.
                    </div>
                  )}

                  {storeStatus !== 'idle' && storeStatus !== 'checking' && storeStatus !== 'waitlisted' && storeStatus !== 'requested' && (
                    <button
                      onClick={() => { setStoreStatus('idle'); setZipCode(''); }}
                      className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                    >
                      Try a different ZIP code
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
