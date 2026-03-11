import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { adminAPI, type AdminStats, type AdminUser, type AdminItem } from '../api/admin';
import { miniStoreAPI, type MiniStoreSettings, type MiniStoreRequestItem } from '../api/miniStore';
import { planAdminAPI, type AdminPlan } from '../api/planAdmin';
import { apiClient } from '../api/config';
import { 
  Users, Package, ShoppingCart, BarChart3, Search, 
  Trash2, Store, ChevronDown, ChevronUp,
  ArrowLeft, AlertTriangle, Check, X, Clock, Loader2, Plus,
  Settings, Edit3, DollarSign, Percent, ToggleLeft, ToggleRight, Save, Zap, Mail
} from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'items' | 'mini-store' | 'plans' | 'contact';

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
  const [storeSettings, setStoreSettings] = useState<MiniStoreSettings | null>(null);
  const [storeRequests, setStoreRequests] = useState<MiniStoreRequestItem[]>([]);
  const [storeRequestFilter, setStoreRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [newZipCode, setNewZipCode] = useState('');
  const [newZipMax, setNewZipMax] = useState('5');
  const [storeLoading, setStoreLoading] = useState(false);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'contact' && contactMessages.length === 0) {
      setContactLoading(true);
      apiClient.get('/contact')
        .then(res => setContactMessages(res.data.messages || []))
        .catch(() => {})
        .finally(() => setContactLoading(false));
    }
  }, [activeTab]);

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
            {(['overview', 'users', 'items', 'mini-store', 'plans', 'contact'] as AdminTab[]).map(tab => (
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

        {activeTab === 'mini-store' && (
          <MiniStoreAdmin
            storeSettings={storeSettings}
            setStoreSettings={setStoreSettings}
            storeRequests={storeRequests}
            setStoreRequests={setStoreRequests}
            storeRequestFilter={storeRequestFilter}
            setStoreRequestFilter={setStoreRequestFilter}
            newZipCode={newZipCode}
            setNewZipCode={setNewZipCode}
            newZipMax={newZipMax}
            setNewZipMax={setNewZipMax}
            storeLoading={storeLoading}
            setStoreLoading={setStoreLoading}
          />
        )}

        {activeTab === 'plans' && (
          <PlansAdmin />
        )}

        {activeTab === 'contact' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">Contact Messages</h2>
              <span className="ml-auto text-xs text-gray-400">{contactMessages.length} message{contactMessages.length !== 1 ? 's' : ''}</span>
            </div>
            {contactLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              </div>
            ) : contactMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No contact messages yet.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {contactMessages.map((msg: any) => (
                  <div key={msg._id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div>
                        <span className="font-semibold text-sm text-gray-900">{msg.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{msg.email}</span>
                        {msg.user?.name && (
                          <span className="text-xs text-green-600 ml-2">• {msg.user.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          msg.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          msg.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {msg.status === 'in_progress' ? 'In Progress' : msg.status === 'resolved' ? 'Resolved' : 'New'}
                        </span>
                        <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">{msg.subject}</p>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MiniStoreAdmin = ({
  storeSettings, setStoreSettings, storeRequests, setStoreRequests,
  storeRequestFilter, setStoreRequestFilter,
  newZipCode, setNewZipCode, newZipMax, setNewZipMax,
  storeLoading, setStoreLoading
}: {
  storeSettings: MiniStoreSettings | null;
  setStoreSettings: (s: MiniStoreSettings | null) => void;
  storeRequests: MiniStoreRequestItem[];
  setStoreRequests: (r: MiniStoreRequestItem[]) => void;
  storeRequestFilter: 'all' | 'pending' | 'approved' | 'rejected';
  setStoreRequestFilter: (f: 'all' | 'pending' | 'approved' | 'rejected') => void;
  newZipCode: string;
  setNewZipCode: (s: string) => void;
  newZipMax: string;
  setNewZipMax: (s: string) => void;
  storeLoading: boolean;
  setStoreLoading: (b: boolean) => void;
}) => {
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);

  useEffect(() => {
    loadStoreData();
  }, []);

  useEffect(() => {
    loadRequests();
  }, [storeRequestFilter]);

  const loadStoreData = async () => {
    try {
      setStoreLoading(true);
      const [settings, requestsData] = await Promise.all([
        miniStoreAPI.getSettings(),
        miniStoreAPI.getRequests()
      ]);
      setStoreSettings(settings);
      setStoreRequests(requestsData.requests);
    } catch {
      console.log('Failed to load mini store data');
    } finally {
      setStoreLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const filter = storeRequestFilter === 'all' ? {} : { status: storeRequestFilter };
      const data = await miniStoreAPI.getRequests(filter);
      setStoreRequests(data.requests);
    } catch {
      console.log('Failed to load requests');
    }
  };

  const toggleSetting = async (key: 'enabled' | 'waitlistEnabled' | 'requireApproval', value: boolean) => {
    try {
      const updated = await miniStoreAPI.updateSettings({ [key]: value });
      setStoreSettings(updated);
    } catch {
      console.log('Failed to update setting');
    }
  };

  const addZipSetting = async () => {
    if (!newZipCode || newZipCode.length < 5) return;
    try {
      const updated = await miniStoreAPI.updateZipSettings({
        zipCode: newZipCode,
        maxStores: parseInt(newZipMax) || 5
      });
      setStoreSettings(updated);
      setNewZipCode('');
      setNewZipMax('5');
    } catch {
      console.log('Failed to add ZIP setting');
    }
  };

  const toggleZipFlag = async (zipCode: string, flag: string, value: boolean) => {
    try {
      const updated = await miniStoreAPI.updateZipSettings({ zipCode, [flag]: value });
      setStoreSettings(updated);
    } catch {
      console.log('Failed to update ZIP setting');
    }
  };

  const removeZip = async (zipCode: string) => {
    try {
      const updated = await miniStoreAPI.deleteZipSettings(zipCode);
      setStoreSettings(updated);
    } catch {
      console.log('Failed to remove ZIP');
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setReviewLoading(id);
      await miniStoreAPI.reviewRequest(id, status);
      await loadRequests();
    } catch {
      console.log('Failed to review request');
    } finally {
      setReviewLoading(null);
    }
  };

  if (storeLoading && !storeSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Store className="h-4 w-4 text-purple-600" />
          Global Controls
        </h3>
        <div className="space-y-3">
          {[
            { key: 'enabled' as const, label: 'Enable Mini Stores', desc: 'Allow users to open stores' },
            { key: 'waitlistEnabled' as const, label: 'Enable Waitlist', desc: 'Let users join waitlist when full' },
            { key: 'requireApproval' as const, label: 'Require Approval', desc: 'Manually approve new stores' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-[10px] text-gray-400">{desc}</p>
              </div>
              <button
                onClick={() => toggleSetting(key, !storeSettings?.[key])}
                className={`relative w-11 h-6 rounded-full transition ${storeSettings?.[key] ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${storeSettings?.[key] ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`} style={{ transform: storeSettings?.[key] ? 'translateX(22px)' : 'translateX(0)' }} />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-800">Default Max Stores/ZIP</p>
              <p className="text-[10px] text-gray-400">Maximum stores per ZIP code</p>
            </div>
            <span className="text-sm font-semibold text-gray-700">{storeSettings?.defaultMaxStoresPerZip || 10}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">ZIP Code Controls</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newZipCode}
            onChange={(e) => setNewZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="ZIP code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={5}
          />
          <input
            type="number"
            value={newZipMax}
            onChange={(e) => setNewZipMax(e.target.value)}
            placeholder="Max"
            className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={addZipSetting}
            disabled={newZipCode.length < 5}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {storeSettings?.zipSettings && storeSettings.zipSettings.length > 0 ? (
          <div className="space-y-2">
            {storeSettings.zipSettings.map((zip) => (
              <div key={zip.zipCode} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">{zip.zipCode}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">Max: {zip.maxStores}</span>
                    <button onClick={() => removeZip(zip.zipCode)} className="text-red-400 hover:text-red-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['paused', 'disabled', 'waitlistOnly', 'requireApproval'].map((flag) => (
                    <button
                      key={flag}
                      onClick={() => toggleZipFlag(zip.zipCode, flag, !(zip as any)[flag])}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition ${
                        (zip as any)[flag]
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {flag === 'waitlistOnly' ? 'Waitlist' : flag === 'requireApproval' ? 'Approval' : flag.charAt(0).toUpperCase() + flag.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-4">No ZIP-specific settings. Default rules apply.</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Requests & Waitlist</h3>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStoreRequestFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition capitalize ${
                  storeRequestFilter === f ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {storeRequests.length > 0 ? (
          <div className="space-y-2">
            {storeRequests.map((req) => (
              <div key={req._id} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{req.user?.name || 'Unknown'}</p>
                  <p className="text-[10px] text-gray-500">{req.email} &middot; ZIP: {req.zipCode}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                      req.type === 'store_request' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {req.type === 'store_request' ? 'Store Request' : 'Waitlist'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                      req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      req.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleReview(req._id, 'approved')}
                      disabled={reviewLoading === req._id}
                      className="p-2 bg-green-600 text-white rounded-lg active:scale-95 transition disabled:opacity-50"
                    >
                      {reviewLoading === req._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleReview(req._id, 'rejected')}
                      disabled={reviewLoading === req._id}
                      className="p-2 bg-red-500 text-white rounded-lg active:scale-95 transition disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No requests found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PlansAdmin = () => {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [testMode, setTestMode] = useState(false);
  const [testModeUpdatedAt, setTestModeUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdminPlan>>({});
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState({ planId: '', name: '', price: 0, yearlyPrice: 0, commissionRate: 5, features: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await planAdminAPI.getSettings();
      setPlans(data.plans);
      setTestMode(data.testMode);
      setTestModeUpdatedAt(data.testModeUpdatedAt);
    } catch {
      setError('Failed to load plan settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTestMode = async () => {
    try {
      setSaving('testMode');
      const result = await planAdminAPI.toggleTestMode(!testMode);
      setTestMode(result.testMode);
      setSuccess(result.message);
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError('Failed to toggle test mode');
    } finally {
      setSaving(null);
    }
  };

  const startEditing = (plan: AdminPlan) => {
    setEditingPlan(plan.planId);
    setEditForm({
      name: plan.name,
      price: plan.price,
      yearlyPrice: plan.yearlyPrice ?? null,
      commissionRate: plan.commissionRate,
      features: [...plan.features],
      active: plan.active
    });
    setNewFeature('');
  };

  const cancelEditing = () => {
    setEditingPlan(null);
    setEditForm({});
    setNewFeature('');
  };

  const handleSavePlan = async (planId: string) => {
    try {
      setSaving(planId);
      setError('');
      const result = await planAdminAPI.updatePlan(planId, editForm);
      setPlans(prev => prev.map(p => p.planId === planId ? result.plan : p));
      setEditingPlan(null);
      setEditForm({});
      setSuccess(result.message);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update plan');
    } finally {
      setSaving(null);
    }
  };

  const handleCreatePlan = async () => {
    try {
      setSaving('new');
      setError('');
      const result = await planAdminAPI.createPlan({
        planId: newPlanForm.planId,
        name: newPlanForm.name,
        price: newPlanForm.price,
        yearlyPrice: newPlanForm.yearlyPrice || undefined,
        commissionRate: newPlanForm.commissionRate / 100,
        features: newPlanForm.features.split('\n').filter(f => f.trim())
      });
      setPlans(prev => [...prev, result.plan]);
      setShowNewPlan(false);
      setNewPlanForm({ planId: '', name: '', price: 0, yearlyPrice: 0, commissionRate: 5, features: '' });
      setSuccess(result.message);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create plan');
    } finally {
      setSaving(null);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This cannot be undone.')) return;
    try {
      setSaving(planId);
      const result = await planAdminAPI.deletePlan(planId);
      setPlans(prev => prev.filter(p => p.planId !== planId));
      setSuccess(result.message);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete plan');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (plan: AdminPlan) => {
    try {
      setSaving(plan.planId);
      const result = await planAdminAPI.updatePlan(plan.planId, { active: !plan.active });
      setPlans(prev => prev.map(p => p.planId === plan.planId ? result.plan : p));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to toggle plan status');
    } finally {
      setSaving(null);
    }
  };

  const addFeatureToEdit = () => {
    if (!newFeature.trim()) return;
    setEditForm(prev => ({
      ...prev,
      features: [...(prev.features || []), newFeature.trim()]
    }));
    setNewFeature('');
  };

  const removeFeatureFromEdit = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center justify-between animate-scale-in">
          <span className="flex items-center gap-2"><Check className="h-4 w-4" />{success}</span>
          <button onClick={() => setSuccess('')}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center justify-between animate-scale-in">
          <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</span>
          <button onClick={() => setError('')}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <div className={`rounded-xl border-2 p-4 shadow-sm ${testMode ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${testMode ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <Zap className={`h-5 w-5 ${testMode ? 'text-amber-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Test Mode</h3>
              <p className="text-[10px] text-gray-500">
                {testMode
                  ? 'All users have access to all features regardless of subscription'
                  : 'Features are restricted based on each user\'s subscription plan'
                }
              </p>
              {testModeUpdatedAt && (
                <p className="text-[9px] text-gray-400 mt-0.5">
                  Last changed: {new Date(testModeUpdatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleToggleTestMode}
            disabled={saving === 'testMode'}
            className="flex items-center gap-1.5"
          >
            {saving === 'testMode' ? (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            ) : testMode ? (
              <ToggleRight className="h-8 w-8 text-amber-500" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-gray-300" />
            )}
          </button>
        </div>
        {testMode && (
          <div className="mt-3 p-2.5 bg-amber-100 rounded-lg">
            <p className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              Test mode is ON. All users can access all paid features. Turn off before launching to enforce subscriptions.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="h-4 w-4 text-green-600" />
            Subscription Plans
          </h3>
          <button
            onClick={() => setShowNewPlan(!showNewPlan)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium active:scale-95 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Plan
          </button>
        </div>

        {showNewPlan && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Create New Plan</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-gray-500 font-medium block mb-1">Plan ID (lowercase, no spaces)</label>
                <input
                  type="text"
                  value={newPlanForm.planId}
                  onChange={(e) => setNewPlanForm(prev => ({ ...prev, planId: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  placeholder="e.g., premium"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-medium block mb-1">Plan Name</label>
                <input
                  type="text"
                  value={newPlanForm.name}
                  onChange={(e) => setNewPlanForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Premium Plan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-medium block mb-1">Monthly Price ($)</label>
                <input
                  type="number"
                  value={newPlanForm.price}
                  onChange={(e) => setNewPlanForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-medium block mb-1">Yearly Price ($) <span className="text-gray-400">— optional</span></label>
                <input
                  type="number"
                  value={newPlanForm.yearlyPrice || ''}
                  onChange={(e) => setNewPlanForm(prev => ({ ...prev, yearlyPrice: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 49.99"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-medium block mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  value={newPlanForm.commissionRate}
                  onChange={(e) => setNewPlanForm(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="text-[10px] text-gray-500 font-medium block mb-1">Features (one per line)</label>
              <textarea
                value={newPlanForm.features}
                onChange={(e) => setNewPlanForm(prev => ({ ...prev, features: e.target.value }))}
                placeholder={'Feature 1\nFeature 2\nFeature 3'}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowNewPlan(false)}
                className="px-4 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={!newPlanForm.planId || !newPlanForm.name || saving === 'new'}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 active:scale-95 transition flex items-center gap-1.5"
              >
                {saving === 'new' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Plan
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.planId} className={`border rounded-xl p-4 transition ${plan.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
              {editingPlan === plan.planId ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium block mb-1">Plan Name</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium block mb-1">
                        Price ($/month) {plan.planId === 'free' && <span className="text-gray-400">— always $0</span>}
                      </label>
                      <input
                        type="number"
                        value={editForm.price ?? 0}
                        onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        step="0.01"
                        disabled={plan.planId === 'free'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium block mb-1">
                        Price ($/year) <span className="text-gray-400">— optional</span>
                      </label>
                      <input
                        type="number"
                        value={editForm.yearlyPrice ?? ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, yearlyPrice: parseFloat(e.target.value) || null }))}
                        min="0"
                        step="0.01"
                        disabled={plan.planId === 'free'}
                        placeholder="Leave empty for no yearly option"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium block mb-1">Commission Rate (%)</label>
                      <input
                        type="number"
                        value={((editForm.commissionRate ?? 0) * 100).toFixed(1)}
                        onChange={(e) => setEditForm(prev => ({ ...prev, commissionRate: (parseFloat(e.target.value) || 0) / 100 }))}
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 font-medium block mb-1">Features</label>
                    <div className="space-y-1.5 mb-2">
                      {(editForm.features || []).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <span className="text-sm text-gray-700 flex-1">{feature}</span>
                          <button onClick={() => removeFeatureFromEdit(idx)} className="text-red-400 hover:text-red-600">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeatureToEdit())}
                        placeholder="Add a feature..."
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={addFeatureToEdit}
                        disabled={!newFeature.trim()}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 active:scale-95 transition"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSavePlan(plan.planId)}
                      disabled={saving === plan.planId}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 active:scale-95 transition flex items-center gap-1.5"
                    >
                      {saving === plan.planId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-semibold text-gray-900">{plan.name}</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${plan.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                        {plan.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-gray-100 text-gray-500">
                        {plan.planId}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEditing(plan)}
                        className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      {plan.planId !== 'free' && (
                        <>
                          <button
                            onClick={() => handleToggleActive(plan)}
                            disabled={saving === plan.planId}
                            className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition"
                          >
                            {plan.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.planId)}
                            disabled={saving === plan.planId}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-800">
                        {plan.price === 0 ? 'Free' : `$${plan.price.toFixed(2)}/mo`}
                        {plan.yearlyPrice ? ` · $${plan.yearlyPrice.toFixed(2)}/yr` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {(plan.commissionRate * 100).toFixed(1)}% commission
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.features.map((f, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 rounded-md text-[10px] text-gray-600">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
