import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../api/auth';
import { itemsAPI } from '../api/items';
import { deleteAccount } from '../api/users';
import { getUserRatings, type Rating } from '../api/ratings';
import { getUserBadges, type UserBadge } from '../api/gamification';
import { User, Mail, Calendar, Package, Lock, ArrowLeft, Trash2, AlertTriangle, Star, Award, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FormInput } from '../components/FormInput';
import { StoreActivationSection } from '../components/StoreActivationSection';
import { useToast } from '../hooks/useToast';

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
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [badges, setBadges] = useState<UserBadge[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await itemsAPI.getMyItems();
        setItemsCount(response.items.length);

        // Fetch ratings and badges
        if (user?.id) {
          const ratingsResponse = await getUserRatings(user.id, 1, 5);
          setRatings(ratingsResponse.ratings || []);
          
          // Calculate average from actual user data
          const total = ratingsResponse.ratings?.reduce((sum: number, r: Rating) => sum + r.rating, 0) || 0;
          const avg = ratingsResponse.ratings?.length > 0 ? total / ratingsResponse.ratings.length : 0;
          setAverageRating(Math.round(avg * 10) / 10);
          setRatingCount(ratingsResponse.total || 0);

          // Fetch badges
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
  }, [user?.id]);

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center">
                <User className="h-10 w-10 text-green-600" />
              </div>
              <div className="ml-6">
                <h1 className="text-3xl font-bold text-white">{user?.name}</h1>
                <p className="text-green-100 mt-1">Grocery Share Member</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <Mail className="h-6 w-6 text-gray-400 mr-4" />
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="text-gray-900 font-medium">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-6 w-6 text-gray-400 mr-4" />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="text-gray-900 font-medium">{formatDate(user?.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <Package className="h-6 w-6 text-gray-400 mr-4" />
                <div>
                  <p className="text-sm text-gray-500">Items Posted</p>
                  <p className="text-gray-900 font-medium">{itemsCount} items</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <Star className="h-6 w-6 text-yellow-400 mr-4" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Community Rating</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(averageRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-900 font-medium">
                      {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet'}
                    </span>
                    {ratingCount > 0 && (
                      <span className="text-sm text-gray-500">({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {badges.length > 0 && (
              <div className="mt-8 border-t pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Achievements
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {badges.map((userBadge) => (
                    <div key={userBadge.badge._id} className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg text-center border border-yellow-200">
                      <div className="text-4xl mb-2">{userBadge.badge.icon}</div>
                      <p className="font-semibold text-sm text-gray-900">{userBadge.badge.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{userBadge.badge.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ratings.length > 0 && (
              <div className="mt-8 border-t pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating._id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{rating.rater.name}</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= rating.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {rating.review && (
                        <p className="text-gray-700 text-sm">{rating.review}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 border-t pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Safety & Community Guidelines
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
                <p className="font-medium text-blue-900">For a safe sharing experience:</p>
                <ul className="list-disc list-inside text-blue-800 text-sm space-y-2 ml-2">
                  <li><strong>Meet in Public:</strong> Choose well-lit, public locations for item exchanges</li>
                  <li><strong>Verify Items:</strong> Check expiration dates and quality before accepting items</li>
                  <li><strong>Trust Your Instincts:</strong> If something feels wrong, decline politely</li>
                  <li><strong>Use In-App Chat:</strong> Keep all communication within the platform for safety</li>
                  <li><strong>Report Issues:</strong> Contact support if you encounter suspicious behavior</li>
                  <li><strong>Be Respectful:</strong> Treat all community members with kindness and respect</li>
                  <li><strong>Food Safety:</strong> Only share items that are properly stored and safe to consume</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-blue-300">
                  <p className="text-sm text-blue-900">
                    <strong>Remember:</strong> Grocery Share connects neighbors to reduce food waste. 
                    By following these guidelines, you help keep our community safe and thriving!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t pt-8">
              <StoreActivationSection />
            </div>

            <div className="mt-8 border-t pt-8">
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="flex items-center text-green-600 hover:text-green-700 font-medium"
              >
                <Lock className="h-5 w-5 mr-2" />
                {showPasswordChange ? 'Cancel Password Change' : 'Change Password'}
              </button>

              {showPasswordChange && (
                <form onSubmit={handlePasswordChange} className="mt-6 space-y-4 max-w-md">
                  {passwordError && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
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
                    placeholder="Enter new password (min 6 characters)"
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
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {passwordLoading ? 'Changing Password...' : 'Change Password'}
                  </button>
                </form>
              )}
            </div>

            <div className="mt-8 border-t pt-8">
              <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Danger Zone
              </h3>
              <p className="text-gray-600 mb-4">
                Once you delete your account, there is no going back. This action is irreversible and will remove all your data, including listings, chats, and requests.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Account</h3>
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 font-semibold">⚠️ Warning: This action cannot be undone!</p>
              <p className="text-red-700 text-sm mt-2">
                All your data will be permanently deleted including:
              </p>
              <ul className="list-disc list-inside text-red-700 text-sm mt-2 ml-2">
                <li>Account information</li>
                <li>All your item listings</li>
                <li>Chat conversations</li>
                <li>Item requests</li>
                <li>Notifications</li>
              </ul>
            </div>
            {!user?.googleId && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your password"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
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
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
                disabled={deleteLoading || (!user?.googleId && !deletePassword)}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
