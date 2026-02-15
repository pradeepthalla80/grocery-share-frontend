import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI, type Item } from '../api/items';
import { ItemCard } from '../components/ItemCard';
import { Plus, Package, AlertCircle, CheckCircle, Clock } from 'lucide-react';

type FilterType = 'all' | 'active' | 'expiring' | 'expired';

export const MyItems = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

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

  useEffect(() => {
    fetchMyItems();
  }, []);

  const handleEdit = (itemId: string) => {
    navigate(`/edit-item/${itemId}`);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await itemsAPI.delete(itemId);
      setItems(items.filter(item => item.id !== itemId));
      alert('Item deleted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete item');
    }
  };

  const getFilteredItems = () => {
    const now = new Date();
    switch (filter) {
      case 'active':
        return items.filter(item => {
          const expiry = new Date(item.expiryDate);
          const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry > 2;
        });
      case 'expiring':
        return items.filter(item => {
          const expiry = new Date(item.expiryDate);
          const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry > 0 && daysUntilExpiry <= 2;
        });
      case 'expired':
        return items.filter(item => new Date(item.expiryDate) < now);
      default:
        return items;
    }
  };

  const filteredItems = getFilteredItems();
  
  const stats = {
    total: items.length,
    active: items.filter(item => {
      const expiry = new Date(item.expiryDate);
      const daysUntilExpiry = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 2;
    }).length,
    expiring: items.filter(item => {
      const expiry = new Date(item.expiryDate);
      const daysUntilExpiry = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 2;
    }).length,
    expired: items.filter(item => new Date(item.expiryDate) < new Date()).length,
  };

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

        <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-2 mb-5 md:mb-8 md:grid md:grid-cols-4 md:gap-4">
          <button onClick={() => setFilter('all')} className={`flex-shrink-0 rounded-xl p-3 md:p-4 min-w-[100px] md:min-w-0 transition border ${filter === 'all' ? 'bg-white border-green-300 shadow-sm' : 'bg-white/60 border-gray-100'}`}>
            <div className="flex items-center gap-2 md:justify-between">
              <Package className={`h-5 w-5 md:h-8 md:w-8 ${filter === 'all' ? 'text-green-600' : 'text-gray-400'}`} />
              <div className="text-left md:text-right">
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Total</p>
              </div>
            </div>
          </button>
          <button onClick={() => setFilter('active')} className={`flex-shrink-0 rounded-xl p-3 md:p-4 min-w-[100px] md:min-w-0 transition border ${filter === 'active' ? 'bg-white border-green-300 shadow-sm' : 'bg-white/60 border-gray-100'}`}>
            <div className="flex items-center gap-2 md:justify-between">
              <CheckCircle className={`h-5 w-5 md:h-8 md:w-8 ${filter === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
              <div className="text-left md:text-right">
                <p className="text-lg md:text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Active</p>
              </div>
            </div>
          </button>
          <button onClick={() => setFilter('expiring')} className={`flex-shrink-0 rounded-xl p-3 md:p-4 min-w-[100px] md:min-w-0 transition border ${filter === 'expiring' ? 'bg-white border-orange-300 shadow-sm' : 'bg-white/60 border-gray-100'}`}>
            <div className="flex items-center gap-2 md:justify-between">
              <Clock className={`h-5 w-5 md:h-8 md:w-8 ${filter === 'expiring' ? 'text-orange-600' : 'text-gray-400'}`} />
              <div className="text-left md:text-right">
                <p className="text-lg md:text-2xl font-bold text-orange-600">{stats.expiring}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Expiring</p>
              </div>
            </div>
          </button>
          <button onClick={() => setFilter('expired')} className={`flex-shrink-0 rounded-xl p-3 md:p-4 min-w-[100px] md:min-w-0 transition border ${filter === 'expired' ? 'bg-white border-red-300 shadow-sm' : 'bg-white/60 border-gray-100'}`}>
            <div className="flex items-center gap-2 md:justify-between">
              <AlertCircle className={`h-5 w-5 md:h-8 md:w-8 ${filter === 'expired' ? 'text-red-600' : 'text-gray-400'}`} />
              <div className="text-left md:text-right">
                <p className="text-lg md:text-2xl font-bold text-red-600">{stats.expired}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Expired</p>
              </div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              showActions
              onEdit={() => handleEdit(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
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
