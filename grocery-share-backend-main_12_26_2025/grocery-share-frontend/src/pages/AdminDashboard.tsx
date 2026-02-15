import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { adminAPI, type AdminStats, type AdminUser, type AdminItem } from '../api/admin';
import { 
  Users, Package, ShoppingCart, BarChart3, Search, 
  Trash2, Store, ChevronDown, ChevronUp,
  ArrowLeft, AlertTriangle
} from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'items';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsData, usersData, itemsData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getItems(),
      ]);
      setStats(statsData);
      setUsers(usersData.users);
      setItems(itemsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUsers({ search: searchQuery, role: roleFilter });
      setUsers(data.users);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      handleSearchUsers();
    }
  }, [searchQuery, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setActionLoading(userId);
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      setConfirmDelete(null);
      if (stats) setStats({ ...stats, totalUsers: stats.totalUsers - 1 });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStore = async (userId: string, currentStatus: boolean) => {
    try {
      setActionLoading(userId);
      await adminAPI.toggleStoreStatus(userId, !currentStatus);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isStoreOwner: !currentStatus } : u));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle store status');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="skeleton h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
          <div className="skeleton h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="flex items-center gap-3 mb-5 md:mb-8">
          <button onClick={() => navigate(-1)} className="md:hidden p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-xs md:text-sm mt-0.5">Manage your platform</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm animate-scale-in">
            {error}
            <button onClick={() => setError('')} className="ml-2 font-semibold">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-5 md:mb-8">
          {[
            { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, bg: 'bg-blue-100', text: 'text-blue-600' },
            { label: 'Total Items', value: stats?.totalItems || 0, icon: Package, bg: 'bg-green-100', text: 'text-green-600' },
            { label: 'Active Items', value: stats?.activeItems || 0, icon: ShoppingCart, bg: 'bg-emerald-100', text: 'text-emerald-600' },
            { label: 'Sold Items', value: stats?.soldItems || 0, icon: BarChart3, bg: 'bg-purple-100', text: 'text-purple-600' },
            { label: 'Requests', value: stats?.totalRequests || 0, icon: Package, bg: 'bg-orange-100', text: 'text-orange-600' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-3 md:p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.text}`} />
                  </div>
                </div>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-[10px] md:text-xs text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mb-4 md:mb-6 sticky top-12 md:top-16 z-30 bg-gray-50 -mx-4 px-4 md:mx-0 md:px-0 py-2 md:py-0">
          <div className="flex bg-gray-100 md:bg-transparent rounded-xl md:rounded-none p-1 md:p-0 md:border-b md:border-gray-200">
            {(['overview', 'users', 'items'] as AdminTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-initial py-2.5 md:pb-4 px-3 md:px-4 rounded-lg md:rounded-none text-sm font-medium transition capitalize ${
                  activeTab === tab
                    ? 'bg-white md:bg-transparent text-green-600 shadow-sm md:shadow-none md:border-b-2 md:border-green-600'
                    : 'text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && stats && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-6 shadow-sm">
              <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3">Platform Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">Total Users</span>
                  <span className="text-sm font-semibold">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">Active Listings</span>
                  <span className="text-sm font-semibold text-green-600">{stats.activeItems}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">Sold Items</span>
                  <span className="text-sm font-semibold text-purple-600">{stats.soldItems}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <span className="text-sm font-semibold text-orange-600">{stats.totalRequests}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Listing Rate</span>
                  <span className="text-sm font-semibold">
                    {stats.totalUsers > 0 ? (stats.totalItems / stats.totalUsers).toFixed(1) : 0} items/user
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-6 shadow-sm">
              <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3">Recent Items</h3>
              <div className="space-y-2">
                {items.slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    {item.imageURL ? (
                      <img src={item.imageURL} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.user?.name || 'Unknown'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.status === 'available' ? 'bg-green-100 text-green-700' :
                      item.status === 'sold' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div className="space-y-2">
              {users.map((u) => (
                <div key={u._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedUser(expandedUser === u._id ? null : u._id)}
                    className="w-full flex items-center gap-3 p-3 md:p-4 active:bg-gray-50 transition"
                  >
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-green-700">
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.role === 'super_admin' ? 'bg-red-100 text-red-700' :
                        u.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                      {u.isStoreOwner && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          Store
                        </span>
                      )}
                      {expandedUser === u._id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </button>

                  {expandedUser === u._id && (
                    <div className="border-t border-gray-100 p-3 md:p-4 bg-gray-50 space-y-3 animate-fade-in">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Items Listed</p>
                          <p className="font-semibold">{u.activityCounts?.items || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Requests Made</p>
                          <p className="font-semibold">{u.activityCounts?.requests || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Joined</p>
                          <p className="font-semibold text-xs">{new Date(u.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Store Owner</p>
                          <p className="font-semibold">{u.isStoreOwner ? 'Yes' : 'No'}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          disabled={actionLoading === u._id || u.role === 'super_admin'}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                        <button
                          onClick={() => handleToggleStore(u._id, !!u.isStoreOwner)}
                          disabled={actionLoading === u._id}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition active:scale-95 disabled:opacity-50 ${
                            u.isStoreOwner
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Store className="h-3 w-3" />
                          {u.isStoreOwner ? 'Revoke Store' : 'Grant Store'}
                        </button>
                        {confirmDelete === u._id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              disabled={actionLoading === u._id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium active:scale-95 disabled:opacity-50"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(u._id)}
                            disabled={u.role === 'super_admin'}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium active:scale-95 disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {users.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No users found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 md:p-4 flex items-center gap-3">
                {item.imageURL ? (
                  <img src={item.imageURL} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.user?.name || 'Unknown'} &middot; {item.user?.email || ''}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    item.status === 'available' ? 'bg-green-100 text-green-700' :
                    item.status === 'sold' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-xs font-semibold text-gray-700">
                    {item.isFree ? 'FREE' : `$${item.price.toFixed(2)}`}
                  </span>
                </div>
              </div>
            ))}
            {items.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No items found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
