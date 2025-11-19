import { useState, useEffect } from 'react';
import { getAdminUserDetails, type AdminUserDetail } from '../api/admin';
import { X, Mail, Calendar, Package, MessageCircle, Star, Store, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface UserDetailModalProps {
  userId: string;
  onClose: () => void;
}

export const UserDetailModal = ({ userId, onClose }: UserDetailModalProps) => {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const data = await getAdminUserDetails(userId);
        setUser(data);
      } catch (error) {
        console.error('Failed to load user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
          <div className="text-center text-gray-500">Loading user details...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
          <div className="text-center text-gray-500">User not found</div>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-2xl">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {user.name}
                {user.isStoreOwner && <Store className="h-5 w-5 text-blue-600" />}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{user.email}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-700">Role</span>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                {user.role.replace('_', ' ')}
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-700">Member Since</span>
              </div>
              <p className="text-gray-900">{format(new Date(user.createdAt), 'MMM dd, yyyy')}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-medium text-gray-700">Rating</span>
              </div>
              {user.ratingCount && user.ratingCount > 0 ? (
                <p className="text-gray-900">
                  ⭐ {user.averageRating?.toFixed(1)} ({user.ratingCount} reviews)
                </p>
              ) : (
                <p className="text-gray-500">No ratings yet</p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Store className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-700">Store Status</span>
              </div>
              {user.isStoreOwner ? (
                <div>
                  <p className="text-blue-600 font-medium">Store Owner</p>
                  {user.storeName && <p className="text-sm text-gray-600">{user.storeName}</p>}
                </div>
              ) : (
                <p className="text-gray-500">Regular User</p>
              )}
            </div>
          </div>

          {/* Activity Stats */}
          {user.activity && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Activity Summary
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">{user.activity.totalItems}</p>
                  <p className="text-sm text-gray-600">Items Listed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{user.activity.totalRequests}</p>
                  <p className="text-sm text-gray-600">Requests Made</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Items */}
          {user.activity && user.activity.recentItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-600" />
                Recent Items ({user.activity.recentItems.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {user.activity.recentItems.map((item: any) => (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.category || 'Uncategorized'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {item.isFree ? 'FREE' : `$${item.price}`}
                      </p>
                      <p className="text-xs text-gray-500">{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Requests */}
          {user.activity && user.activity.recentRequests.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-gray-600" />
                Recent Requests ({user.activity.recentRequests.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {user.activity.recentRequests.map((request: any) => (
                  <div key={request._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{request.itemName}</p>
                      <p className="text-sm text-gray-600">{request.category || 'Uncategorized'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {request.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
