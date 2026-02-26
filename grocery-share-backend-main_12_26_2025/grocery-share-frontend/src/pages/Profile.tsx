import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../api/auth';
import { itemsAPI } from '../api/items';
import { deleteAccount } from '../api/users';
import { getUserRatings, type Rating } from '../api/ratings';
import { getUserBadges, type UserBadge } from '../api/gamification';
import { Mail, Calendar, Lock, ArrowLeft, Trash2, AlertTriangle, Star, Award, Shield, Store, CreditCard, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FormInput } from '../components/FormInput';
import { useToast } from '../hooks/useToast';
import { getAccountStatus, createConnectedAccount, createAccountLink } from '../api/stripeConnect';

export const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [itemsCount, setItemsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeActionLoading, setStripeActionLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [badges, setBadges] = useState<UserBadge[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await itemsAPI.getMyItems();
        setItemsCount(response.items.length);

        if (user?.id) {
          const ratingsResponse = await getUserRatings(user.id, 1, 5);
          setRatings(ratingsResponse.ratings || []);
          
          const total = ratingsResponse.ratings?.reduce((sum: number, r: Rating) => sum + r.rating, 0) || 0;
          const avg = ratingsResponse.ratings?.length > 0 ? total / ratingsResponse.ratings.length : 0;
          setAverageRating(Math.round(avg * 10) / 10);
          setRatingCount(ratingsResponse.total || 0);

          try {
            const badgesResponse = await getUserBadges(user.id);
            setBadges(badgesResponse.badges || []);
          } catch (err) {
            console.error('Failed to fetch badges:', err);
          }
        }
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    const fetchStripe = async () => {
      try {
        const data = await getAccountStatus();
        setStripeStatus(data);
      } catch (err) {
        console.error('Failed to fetch Stripe status:', err);
      } finally {
        setStripeLoading(false);
      }
    };
    fetchStripe();
  }, [user?.id]);

  const handleStripeSetup = async () => {
    try {
      setStripeActionLoading(true);
      if (!stripeStatus?.hasAccount) {
        await createConnectedAccount(selectedCountry);
      }
      const linkData = await createAccountLink();
      if (linkData.url) {
        window.open(linkData.url, '_blank');
      }
      showToast('Complete your Stripe setup in the new tab.', 'success');
      const data = await getAccountStatus();
      setStripeStatus(data);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to set up Stripe account', 'error');
    } finally {
      setStripeActionLoading(false);
      setShowCountryPicker(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      setPasswordLoading(true);
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-36 md:h-44 skeleton rounded-none" />
        <div className="max-w-4xl mx-auto px-4 -mt-10">
          <div className="h-20 w-20 skeleton rounded-full" />
          <div className="mt-4 space-y-3">
            <div className="h-6 w-48 skeleton" />
            <div className="h-4 w-32 skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto md:px-4 md:py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="hidden md:flex mb-6 items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-green-600 via-green-600 to-emerald-700 px-5 py-6 md:px-8 md:py-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <button
              onClick={() => navigate('/dashboard')}
              className="md:hidden absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white active:bg-white/30"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/30">
                <span className="text-2xl md:text-3xl font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-white">{user?.name}</h1>
                <p className="text-green-100 text-sm mt-0.5">BaskMate Member</p>
              </div>
            </div>
          </div>

          <div className="flex gap-0 border-b border-gray-100">
            <div className="flex-1 text-center py-4 border-r border-gray-100">
              <p className="text-xl md:text-2xl font-bold text-gray-900">{itemsCount}</p>
              <p className="text-[10px] md:text-xs text-gray-500">Items</p>
            </div>
            <div className="flex-1 text-center py-4 border-r border-gray-100">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <p className="text-xl md:text-2xl font-bold text-gray-900">{averageRating > 0 ? averageRating.toFixed(1) : '-'}</p>
              </div>
              <p className="text-[10px] md:text-xs text-gray-500">Rating</p>
            </div>
            <div className="flex-1 text-center py-4">
              <p className="text-xl md:text-2xl font-bold text-gray-900">{badges.length}</p>
              <p className="text-[10px] md:text-xs text-gray-500">Badges</p>
            </div>
          </div>

          <div className="p-4 md:px-8 md:py-8">
            {!user?.isStoreOwner && (
              <div className="mb-5 bg-gradient-to-r from-emerald-600 to-green-700 rounded-xl p-4 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold">Become a Store Owner</h3>
                    <p className="text-green-100 text-xs mt-0.5">Grow your business on BaskMate</p>
                  </div>
                  <button
                    onClick={() => navigate('/store-setup')}
                    className="bg-white text-green-700 px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition flex-shrink-0"
                  >
                    Start
                  </button>
                </div>
              </div>
            )}

            {user?.isStoreOwner && (
              <div className="mb-5 bg-purple-50 border border-purple-100 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Store className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-purple-900">{user?.storeName || 'Store Owner'}</p>
                  <p className="text-[10px] text-purple-600">Store Mode Active</p>
                </div>
                <button
                  onClick={() => navigate('/my-store')}
                  className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition flex-shrink-0"
                >
                  My Store
                </button>
              </div>
            )}

            {!user?.isStoreOwner && !stripeLoading && (
              <div className="mb-5 bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Stripe Payment Account</p>
                    <p className="text-[10px] text-gray-500">Required to receive payments for paid items</p>
                  </div>
                </div>
                {stripeStatus?.hasAccount && stripeStatus?.accountStatus?.chargesEnabled ? (
                  <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <p className="text-xs text-green-700 font-medium">Stripe account is active. You can receive payments.</p>
                  </div>
                ) : stripeStatus?.hasAccount && stripeStatus?.accountStatus?.detailsSubmitted ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <p className="text-xs text-amber-700">Stripe account is under review.</p>
                    </div>
                  </div>
                ) : stripeStatus?.hasAccount ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Your Stripe setup is incomplete. Complete it to start receiving payments.</p>
                    <button
                      onClick={handleStripeSetup}
                      disabled={stripeActionLoading}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-medium active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {stripeActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                      Complete Stripe Setup
                    </button>
                  </div>
                ) : !showCountryPicker ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Set up a free Stripe account to receive payments directly to your bank account when you sell items.</p>
                    <button
                      onClick={() => setShowCountryPicker(true)}
                      disabled={stripeActionLoading}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-medium active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Connect with Stripe
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600 mb-1">Select your country</label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="AU">Australia</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCountryPicker(false)}
                        className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleStripeSetup}
                        disabled={stripeActionLoading}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {stripeActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                        Continue
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => navigate('/plans')}
              className="w-full mb-5 bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-center gap-3 active:bg-gray-100 transition text-left"
            >
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Plans & Pricing</p>
                <p className="text-[10px] text-gray-500">View fees, upgrades & seller tools</p>
              </div>
            </button>

            <h2 className="text-base md:text-xl font-semibold text-gray-900 mb-4">Account Info</h2>
            
            <div className="space-y-2.5 md:space-y-3">
              <div className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900 font-medium truncate">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-gray-500">Member Since</p>
                  <p className="text-sm text-gray-900 font-medium">{formatDate(user?.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] md:text-xs text-gray-500">Community Rating</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= Math.round(averageRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-900 font-medium">
                      {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}
                    </span>
                    {ratingCount > 0 && (
                      <span className="text-xs text-gray-400">({ratingCount})</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {badges.length > 0 && (
              <div className="mt-6 md:mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Achievements
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
                  {badges.map((userBadge) => (
                    <div key={userBadge.badge._id} className="p-3 md:p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl text-center border border-yellow-100">
                      <div className="text-3xl md:text-4xl mb-1">{userBadge.badge.icon}</div>
                      <p className="font-semibold text-xs text-gray-900">{userBadge.badge.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{userBadge.badge.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ratings.length > 0 && (
              <div className="mt-6 md:mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Recent Reviews</h3>
                <div className="space-y-2.5">
                  {ratings.map((rating) => (
                    <div key={rating._id} className="p-3 md:p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-sm text-gray-900">{rating.rater.name}</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= rating.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {rating.review && (
                        <p className="text-gray-600 text-xs">{rating.review}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 md:mt-8 border-t border-gray-100 pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Safety Guidelines
              </h3>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                <ul className="text-blue-800 text-xs space-y-1.5">
                  <li><strong>Meet in Public:</strong> Choose well-lit, public locations</li>
                  <li><strong>Verify Items:</strong> Check expiration dates and quality</li>
                  <li><strong>Trust Your Instincts:</strong> Decline if something feels wrong</li>
                  <li><strong>Use In-App Chat:</strong> Keep communication on the platform</li>
                  <li><strong>Report Issues:</strong> Contact support for suspicious behavior</li>
                  <li><strong>Food Safety:</strong> Only share properly stored items</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 md:mt-8 border-t border-gray-100 pt-6">
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="flex items-center text-green-600 active:text-green-700 font-medium text-sm"
              >
                <Lock className="h-4 w-4 mr-2" />
                {showPasswordChange ? 'Cancel' : 'Change Password'}
              </button>

              {showPasswordChange && (
                <form onSubmit={handlePasswordChange} className="mt-4 space-y-3 max-w-md">
                  {passwordError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
                      {passwordSuccess}
                    </div>
                  )}

                  <FormInput
                    label="Current Password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required
                    placeholder="Enter current password"
                  />

                  <FormInput
                    label="New Password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                    placeholder="Min 6 characters"
                  />

                  <FormInput
                    label="Confirm New Password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                    placeholder="Confirm new password"
                  />

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full bg-green-600 text-white py-2.5 px-4 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm active:scale-[0.98]"
                  >
                    {passwordLoading ? 'Changing...' : 'Update Password'}
                  </button>
                </form>
              )}
            </div>

            <div className="mt-6 md:mt-8 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1.5" />
                Danger Zone
              </h3>
              <p className="text-gray-500 text-xs mb-3">
                Deleting your account is permanent and removes all your data.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center px-3.5 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium active:bg-red-100 transition"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl max-w-md w-full p-5 md:p-6 animate-slide-up md:animate-scale-in">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 md:hidden" />
            <h3 className="text-lg font-bold text-gray-900 mb-3">Delete Account</h3>
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800 font-semibold text-sm">This action cannot be undone!</p>
              <p className="text-red-700 text-xs mt-1">
                All data will be permanently deleted:
              </p>
              <ul className="list-disc list-inside text-red-700 text-xs mt-1 ml-1 space-y-0.5">
                <li>Account & profile</li>
                <li>Item listings</li>
                <li>Chat conversations</li>
                <li>Requests & notifications</li>
              </ul>
            </div>
            {!user?.googleId && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Enter password to confirm:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  placeholder="Your password"
                />
              </div>
            )}
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl active:bg-gray-50 transition text-sm font-medium"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setDeleteLoading(true);
                    await deleteAccount(user?.googleId ? undefined : deletePassword);
                    showToast('Account deleted successfully', 'success');
                    logout();
                    navigate('/login');
                  } catch (error: any) {
                    showToast(error.response?.data?.error || 'Failed to delete account', 'error');
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl active:bg-red-700 transition disabled:opacity-50 text-sm font-medium"
                disabled={deleteLoading || (!user?.googleId && !deletePassword)}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
