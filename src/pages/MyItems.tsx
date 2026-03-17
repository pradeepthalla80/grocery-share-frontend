import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI, type Item } from '../api/items';
import { getPickupRequests, acceptPickupRequest, declinePickupRequest, type PickupRequest } from '../api/pickupRequests';
import { ItemCard } from '../components/ItemCard';
import { Plus, Package, AlertCircle, CheckCircle, Clock, ShoppingBag, MapPin, Check, X, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { parseLocalDate } from '../utils/date';
import { useToast } from '../hooks/useToast';
import { format } from 'date-fns';

type FilterType = 'all' | 'active' | 'expiring' | 'expired';

export const MyItems = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showRequests, setShowRequests] = useState(true);
  void loadingRequests;
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [acceptForm, setAcceptForm] = useState<{ requestId: string; address: string; instructions: string; deliveryMode: string } | null>(null);

  const fetchMyItems = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await itemsAPI.getMyItems();
      setItems(response.items);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch your items');
    } finally {
      setLoading(false);
    }
  };

  const fetchPickupRequests = async () => {
    try {
      setLoadingRequests(true);
      const requests = await getPickupRequests({ role: 'seller' });
      const requestList = Array.isArray(requests) ? requests : (requests as any)?.requests || [];
      setPickupRequests(requestList.filter((r: PickupRequest) => r.status === 'pending' || r.status === 'awaiting_pickup'));
    } catch (err: any) {
      console.error('Failed to fetch pickup requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchMyItems();
    fetchPickupRequests();
  }, []);

  const handleEdit = (itemId: string) => {
    if (!itemId) { alert('Could not identify this item. Please refresh and try again.'); return; }
    navigate(`/edit-item/${itemId}`);
  };

  const handleDelete = async (itemId: string) => {
    if (!itemId) { alert('Could not identify this item. Please refresh and try again.'); return; }
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      console.log('[MyItems] Deleting item:', itemId);
      await itemsAPI.delete(itemId);
      setItems(items.filter(item => (item.id || item._id) !== itemId));
      alert('Item deleted successfully!');
    } catch (err: any) {
      console.error('[MyItems] Delete error:', err.response?.status, err.response?.data);
      const details = err.response?.data?.details ? `\n\nDetails: ${err.response.data.details}` : '';
      alert((err.response?.data?.error || 'Failed to delete item') + details);
    }
  };

  const handleAcceptRequest = async () => {
    if (!acceptForm) return;
    if (!acceptForm.address.trim()) {
      showToast('Please enter a pickup address', 'error');
      return;
    }
    try {
      setAcceptingId(acceptForm.requestId);
      await acceptPickupRequest(acceptForm.requestId, {
        deliveryMode: acceptForm.deliveryMode,
        address: acceptForm.address.trim(),
        instructions: acceptForm.instructions.trim() || undefined,
      });
      showToast('Request accepted! Your address has been shared with the buyer.', 'success');
      setAcceptForm(null);
      fetchPickupRequests();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to accept request', 'error');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to decline this pickup request?')) return;
    try {
      setDecliningId(requestId);
      await declinePickupRequest(requestId);
      showToast('Request declined', 'info');
      fetchPickupRequests();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to decline request', 'error');
    } finally {
      setDecliningId(null);
    }
  };

  const getFilteredItems = () => {
    const now = new Date();
    switch (filter) {
      case 'active':
        return items.filter(item => {
          const expiry = parseLocalDate(item.expiryDate);
          const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry > 2;
        });
      case 'expiring':
        return items.filter(item => {
          const expiry = parseLocalDate(item.expiryDate);
          const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry > 0 && daysUntilExpiry <= 2;
        });
      case 'expired':
        return items.filter(item => parseLocalDate(item.expiryDate) < now);
      default:
        return items;
    }
  };

  const filteredItems = getFilteredItems();
  
  const stats = {
    total: items.length,
    active: items.filter(item => {
      const expiry = parseLocalDate(item.expiryDate);
      const daysUntilExpiry = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 2;
    }).length,
    expiring: items.filter(item => {
      const expiry = parseLocalDate(item.expiryDate);
      const daysUntilExpiry = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 2;
    }).length,
    expired: items.filter(item => parseLocalDate(item.expiryDate) < new Date()).length,
  };

  const pendingRequests = pickupRequests.filter(r => r.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <div className="h-8 w-48 skeleton mb-6" />
          <div className="flex gap-3 overflow-x-auto hide-scrollbar mb-6">
            {[1,2,3,4].map(i => <div key={i} className="h-16 w-28 skeleton flex-shrink-0 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-72 skeleton rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="flex justify-between items-start mb-5 md:mb-8">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">My Items</h1>
            <p className="text-gray-500 mt-0.5 text-xs md:text-base">Manage your grocery listings</p>
          </div>
          <button
            onClick={() => navigate('/add-item')}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3.5 py-2 rounded-xl text-sm font-medium active:scale-[0.97] transition"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">Add Item</span>
            <span className="md:hidden">Add</span>
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowRequests(!showRequests)}
              className="w-full flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-3"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-orange-800">
                  Pickup Requests ({pendingRequests.length})
                </span>
              </div>
              {showRequests ? <ChevronUp className="h-4 w-4 text-orange-600" /> : <ChevronDown className="h-4 w-4 text-orange-600" />}
            </button>

            {showRequests && (
              <div className="space-y-3">
                {pendingRequests.map((req) => {
                  const reqId = req._id || req.id;
                  const buyerName = req.buyer?.name || req.requester?.name || 'Someone';
                  const itemName = req.item?.name || 'your item';
                  const isAccepting = acceptForm?.requestId === reqId;

                  return (
                    <div key={reqId} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-orange-700">{buyerName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{buyerName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            wants to pick up <span className="font-medium text-gray-700">"{itemName}"</span>
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {req.createdAt ? format(new Date(req.createdAt), 'MMM dd, h:mm a') : ''}
                          </p>
                        </div>
                      </div>

                      {isAccepting ? (
                        <div className="mt-3 space-y-2.5 bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs font-medium text-green-800">Provide pickup details:</p>
                          <div>
                            <label className="text-xs text-gray-600">Pickup or Delivery?</label>
                            <select
                              value={acceptForm.deliveryMode}
                              onChange={(e) => setAcceptForm({ ...acceptForm, deliveryMode: e.target.value })}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                              <option value="pickup">Buyer picks up from me</option>
                              <option value="delivery">I will deliver to buyer</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {acceptForm.deliveryMode === 'pickup' ? 'Your pickup address' : 'Delivery address'}
                            </label>
                            <input
                              type="text"
                              value={acceptForm.address}
                              onChange={(e) => setAcceptForm({ ...acceptForm, address: e.target.value })}
                              placeholder="Enter address..."
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Instructions (optional)</label>
                            <input
                              type="text"
                              value={acceptForm.instructions}
                              onChange={(e) => setAcceptForm({ ...acceptForm, instructions: e.target.value })}
                              placeholder="e.g., Ring doorbell, items on porch..."
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => setAcceptForm(null)}
                              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAcceptRequest}
                              disabled={acceptingId === reqId}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                              {acceptingId === reqId ? 'Accepting...' : 'Accept & Share Address'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => {
                              const buyerId = req.buyer?._id || req.buyer?.id || req.requester?._id || req.requester?.id;
                              const chatItemId = req.item?._id || req.item?.id;
                              if (buyerId) {
                                navigate(`/chat?receiverId=${buyerId}${chatItemId ? `&itemId=${chatItemId}` : ''}&message=${encodeURIComponent(`Hi! About your request for "${itemName}"...`)}`);
                              }
                            }}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Chat
                          </button>
                          <button
                            onClick={() => setAcceptForm({ requestId: reqId, address: '', instructions: '', deliveryMode: 'pickup' })}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(reqId)}
                            disabled={decliningId === reqId}
                            className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-2 mb-5 md:mb-8 md:grid md:grid-cols-4 md:gap-4">
          <button onClick={() => setFilter('all')} className={`flex-shrink-0 rounded-xl p-3 md:p-4 min-w-[100px] md:min-w-0 transition border ${filter === 'all' ? 'bg-white border-green-300 shadow-sm' : 'bg-white/60 border-gray-100'}`}>
            <div className="flex items-center gap-2 md:justify-between">
              <Package className={`h-5 w-5 md:h-8 md:w-8 ${filter === 'all' ? 'text-green-600' : 'text-gray-500'}`} />
              <div className="text-left md:text-right">
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Total</p>
              </div>
            </div>
          </button>
          <button onClick={() => setFilter('active')} className={`flex-shrink-0 rounded-xl p-3 md:p-4 min-w-[100px] md:min-w-0 transition border ${filter === 'active' ? 'bg-white border-green-300 shadow-sm' : 'bg-white/60 border-gray-100'}`}>
            <div className="flex items-center gap-2 md:justify-between">
              <CheckCircle className={`h-5 w-5 md:h-8 md:w-8 ${filter === 'active' ? 'text-green-600' : 'text-gray-500'}`} />
              <div className="text-left md:text-right">
                <p className="text-lg md:text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Active</p>
              </div>
            </div>
          </button>
          <button onClick={() => setFilter('expiring')} className={`flex-shrink-0 rounded-xl p-3 md:p-4 min-w-[100px] md:min-w-0 transition border ${filter === 'expiring' ? 'bg-white border-orange-300 shadow-sm' : 'bg-white/60 border-gray-100'}`}>
            <div className="flex items-center gap-2 md:justify-between">
              <Clock className={`h-5 w-5 md:h-8 md:w-8 ${filter === 'expiring' ? 'text-orange-600' : 'text-gray-500'}`} />
              <div className="text-left md:text-right">
                <p className="text-lg md:text-2xl font-bold text-orange-600">{stats.expiring}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Expiring</p>
              </div>
            </div>
          </button>
          <button onClick={() => setFilter('expired')} className={`flex-shrink-0 rounded-xl p-3 md:p-4 min-w-[100px] md:min-w-0 transition border ${filter === 'expired' ? 'bg-white border-red-300 shadow-sm' : 'bg-white/60 border-gray-100'}`}>
            <div className="flex items-center gap-2 md:justify-between">
              <AlertCircle className={`h-5 w-5 md:h-8 md:w-8 ${filter === 'expired' ? 'text-red-600' : 'text-gray-500'}`} />
              <div className="text-left md:text-right">
                <p className="text-lg md:text-2xl font-bold text-red-600">{stats.expired}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Expired</p>
              </div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredItems.map((item) => {
            const itemId = item.id || item._id || '';
            return (
              <ItemCard
                key={itemId}
                item={item}
                showActions
                onEdit={() => handleEdit(itemId)}
                onDelete={() => handleDelete(itemId)}
              />
            );
          })}
        </div>

        {filteredItems.length === 0 && items.length > 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">No items in this category</p>
            <p className="text-gray-400 text-sm mt-1">Try switching to a different filter</p>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-50 rounded-full mx-auto flex items-center justify-center mb-4">
              <Package className="h-10 w-10 text-green-300" />
            </div>
            <p className="text-gray-700 font-semibold text-lg">No items yet</p>
            <p className="text-gray-400 text-sm mt-1 mb-5">Start sharing your groceries with the community!</p>
            <button
              onClick={() => navigate('/add-item')}
              className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium active:scale-[0.97] transition"
            >
              Add Your First Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
