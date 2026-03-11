import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { miniStoreAPI } from '../api/miniStore';
import { subscriptionAPI, type Plan, type SubscriptionInfo } from '../api/subscription';
import { ArrowLeft, Check, Crown, Store, Sparkles, Clock, Loader2, AlertCircle, X, Zap } from 'lucide-react';

type StoreStatus = 'idle' | 'checking' | 'available' | 'approval_required' | 'pending_approval' | 'waitlist_only' | 'zip_blocked' | 'zip_paused' | 'zip_full' | 'globally_disabled' | 'waitlisted' | 'requested' | 'error';

export const PlansAndPricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [zipCode, setZipCode] = useState('');
  const [storeStatus, setStoreStatus] = useState<StoreStatus>('idle');
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [testMode, setTestMode] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const hasYearlyPlans = plans.some(p => p.yearlyPrice && p.yearlyPrice > 0);

  useEffect(() => {
    loadPlans();
    if (user) {
      loadSubscription();
    }
  }, [user]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const status = searchParams.get('status');
    if (status === 'success' && sessionId) {
      verifyCheckout(sessionId);
    } else if (status === 'cancelled') {
      setErrorMessage('Subscription checkout was cancelled.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  }, [searchParams]);

  const loadPlans = async () => {
    try {
      setPlansLoading(true);
      const data = await subscriptionAPI.getPlans();
      setPlans(data.plans);
      if (data.testMode !== undefined) {
        setTestMode(data.testMode);
      }
    } catch {
      setPlans([
        { id: 'free', name: 'Free Membership', price: 0, commissionRate: 0.05, features: ['List items locally', 'Browse & purchase nearby', 'Messaging & pickup coordination'] },
        { id: 'plus', name: 'BaskMate Plus', price: 4.99, commissionRate: 0.03, features: ['Reduced transaction fees', 'Priority listing visibility', 'Seller insights & analytics', 'Trust badge'] },
        { id: 'mini_store', name: 'Mini Store', price: 19.99, commissionRate: 0.02, features: ['Lowest transaction fees', 'Dedicated store page', 'Inventory management', 'Advanced analytics', 'Priority support'] }
      ]);
    } finally {
      setPlansLoading(false);
    }
  };

  const loadSubscription = async () => {
    try {
      const info = await subscriptionAPI.getCurrentSubscription();
      setSubscriptionInfo(info);
      if (info.testMode !== undefined) {
        setTestMode(info.testMode);
      }
    } catch {
    }
  };

  const verifyCheckout = async (sessionId: string) => {
    try {
      const result = await subscriptionAPI.verifySession(sessionId);
      if (result.success) {
        setSuccessMessage('Your subscription is now active!');
        await loadSubscription();
      }
    } catch {
      setErrorMessage('Could not verify your subscription. Please refresh the page.');
    }
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setSubscribing(planId);
      setErrorMessage('');
      const { url } = await subscriptionAPI.createCheckoutSession(planId, billingInterval);
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Failed to start checkout. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You\'ll keep your benefits until the end of the billing period.')) return;
    try {
      setCanceling(true);
      setErrorMessage('');
      const result = await subscriptionAPI.cancelSubscription();
      setSuccessMessage(result.message);
      await loadSubscription();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Failed to cancel subscription.');
    } finally {
      setCanceling(false);
    }
  };

  const currentPlan = subscriptionInfo?.plan || 'free';
  const isActive = subscriptionInfo?.subscriptionStatus === 'active';
  const isCanceled = subscriptionInfo?.subscriptionStatus === 'canceled';

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

  const freePlan = plans.find(p => p.id === 'free');
  const paidPlans = plans.filter(p => p.id !== 'free' && p.price > 0);
  const maxSavingsPct = paidPlans.length > 0
    ? Math.max(...paidPlans
        .filter(p => p.yearlyPrice && p.yearlyPrice > 0)
        .map(p => Math.round((1 - (p.yearlyPrice as number) / (p.price * 12)) * 100)))
    : 0;

  const getPlanIcon = (planId: string) => {
    if (planId === 'mini_store') return Store;
    if (planId === 'free') return Check;
    return Crown;
  };

  const getPlanColor = (planId: string) => {
    if (planId === 'mini_store') return { border: 'border-purple-300', activeBorder: 'border-purple-400', bg: 'bg-purple-100', text: 'text-purple-600', tag: 'bg-purple-600', featureIcon: 'text-purple-500', feeBg: 'bg-purple-50', feeText: 'text-purple-700', feeBold: 'text-purple-800', statusBg: 'bg-purple-50', statusText: 'text-purple-600', tagLabel: 'PRO' };
    if (planId === 'plus') return { border: 'border-green-300', activeBorder: 'border-green-400', bg: 'bg-green-100', text: 'text-green-600', tag: 'bg-green-600', featureIcon: 'text-green-500', feeBg: 'bg-green-50', feeText: 'text-green-700', feeBold: 'text-green-800', statusBg: 'bg-green-50', statusText: 'text-green-600', tagLabel: 'POPULAR' };
    return { border: 'border-gray-200', activeBorder: 'border-green-400', bg: 'bg-gray-100', text: 'text-gray-600', tag: '', featureIcon: 'text-green-500', feeBg: 'bg-gray-50', feeText: 'text-gray-600', feeBold: 'text-gray-800', statusBg: 'bg-green-50', statusText: 'text-green-600', tagLabel: '' };
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    );
  }

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
          {hasYearlyPlans && (
            <div className="mt-4 inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${billingInterval === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${billingInterval === 'year' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Yearly
                {maxSavingsPct > 0 && (
                  <span className="ml-1.5 text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full">
                    Save {maxSavingsPct}%
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {testMode && (
          <div className="mb-4 bg-amber-50 border-2 border-amber-300 rounded-xl p-3 text-sm text-amber-800 flex items-center gap-2 animate-scale-in">
            <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span className="font-medium">Test Mode Active — All features are unlocked for everyone during testing.</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 flex items-center justify-between">
            <span className="flex items-center gap-2"><Check className="h-4 w-4" />{successMessage}</span>
            <button onClick={() => setSuccessMessage('')}><X className="h-4 w-4" /></button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{errorMessage}</span>
            <button onClick={() => setErrorMessage('')}><X className="h-4 w-4" /></button>
          </div>
        )}

        <div className="space-y-4">
          {freePlan && (
            <div className={`bg-white rounded-2xl border-2 ${currentPlan === 'free' ? 'border-green-400' : 'border-gray-200'} p-5 shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{freePlan.name}</h2>
                  <p className="text-2xl font-bold text-green-600 mt-0.5">Free</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Check className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              <ul className="space-y-2 mb-4">
                {freePlan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                Service Fee: <span className="font-semibold text-gray-800">{(freePlan.commissionRate * 100).toFixed(0)}%</span> per sale
              </div>
              {currentPlan === 'free' && (
                <div className="mt-3 text-center text-xs font-medium text-green-600 bg-green-50 rounded-lg py-2">
                  Current Plan
                </div>
              )}
            </div>
          )}

          {paidPlans.map((plan) => {
            const colors = getPlanColor(plan.id);
            const Icon = getPlanIcon(plan.id);
            const isMiniStore = plan.id === 'mini_store';
            const isCurrentPlan = currentPlan === plan.id;

            return (
              <div key={plan.id} className={`bg-white rounded-2xl border-2 ${isCurrentPlan ? colors.activeBorder : colors.border} p-5 shadow-sm relative overflow-hidden`}>
                {colors.tagLabel && (
                  <div className={`absolute top-0 right-0 ${colors.tag} text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl`}>{colors.tagLabel}</div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                    {billingInterval === 'year' && plan.yearlyPrice && plan.yearlyPrice > 0 ? (
                      <div>
                        <p className={`text-2xl font-bold ${colors.text} mt-0.5`}>
                          ${plan.yearlyPrice.toFixed(2)}<span className="text-sm font-normal text-gray-500">/year</span>
                        </p>
                        <p className="text-[11px] text-gray-400 line-through">${(plan.price * 12).toFixed(2)}/year</p>
                      </div>
                    ) : (
                      <p className={`text-2xl font-bold ${colors.text} mt-0.5`}>
                        ${plan.price.toFixed(2)}<span className="text-sm font-normal text-gray-500">/month</span>
                      </p>
                    )}
                  </div>
                  <div className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                </div>

                {isMiniStore && (
                  <p className="text-xs text-gray-500 mb-3">For frequent sellers & home-based businesses</p>
                )}

                <ul className="space-y-2 mb-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Sparkles className={`h-4 w-4 ${colors.featureIcon} mt-0.5 flex-shrink-0`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className={`${colors.feeBg} rounded-lg px-3 py-2 text-xs ${colors.feeText} mb-3`}>
                  Service Fee: <span className={`font-semibold ${colors.feeBold}`}>{(plan.commissionRate * 100).toFixed(0)}%</span> per sale
                </div>

                {isCurrentPlan && isActive ? (
                  <div className="space-y-2">
                    <div className={`text-center text-xs font-medium ${colors.statusText} ${colors.statusBg} rounded-lg py-2`}>
                      {isCanceled ? 'Active until end of billing period' : 'Current Plan'}
                    </div>
                    {!isCanceled && (
                      <button
                        onClick={handleCancel}
                        disabled={canceling}
                        className="w-full py-2 text-gray-400 text-xs hover:text-red-500 transition flex items-center justify-center gap-1"
                      >
                        {canceling && <Loader2 className="h-3 w-3 animate-spin" />}
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                ) : isCurrentPlan && isCanceled ? (
                  <div className="space-y-2">
                    <div className="text-center text-xs font-medium text-amber-600 bg-amber-50 rounded-lg py-2">
                      Cancels at end of billing period
                    </div>
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribing === plan.id}
                      className={`w-full py-2.5 ${colors.tag || 'bg-green-600'} text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                      {subscribing === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                      Resubscribe
                    </button>
                  </div>
                ) : isMiniStore ? (
                  <div className="border-t border-gray-100 pt-3 mt-1">
                    <p className="text-[11px] text-gray-400 mb-3 flex items-start gap-1">
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      Mini Store availability may be limited by area to protect seller success.
                    </p>

                    {user?.isStoreOwner ? (
                      <div className="space-y-2">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          You have an active Mini Store
                        </div>
                        {currentPlan !== 'mini_store' && (
                          <button
                            onClick={() => handleSubscribe('mini_store')}
                            disabled={subscribing === 'mini_store'}
                            className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {subscribing === 'mini_store' && <Loader2 className="h-4 w-4 animate-spin" />}
                            Subscribe to Mini Store Plan
                          </button>
                        )}
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
                            onClick={() => handleSubscribe('mini_store')}
                            disabled={subscribing === 'mini_store'}
                            className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {subscribing === 'mini_store' && <Loader2 className="h-4 w-4 animate-spin" />}
                            Subscribe & Open Mini Store
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
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing === plan.id}
                    className={`w-full py-2.5 ${colors.tag || 'bg-green-600'} text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2`}
                  >
                    {subscribing === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                    {currentPlan !== 'free' ? `Switch to ${plan.name}` : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {subscriptionInfo && subscriptionInfo.plan !== 'free' && subscriptionInfo.currentPeriodEnd && (
          <div className="mt-4 text-center text-xs text-gray-400">
            {isCanceled
              ? `Your benefits are active until ${new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString()}`
              : `Next billing date: ${new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString()}`
            }
          </div>
        )}
      </div>
    </div>
  );
};
