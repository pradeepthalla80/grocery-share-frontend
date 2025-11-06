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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading your items...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Listed Items</h1>
            <p className="text-gray-600 mt-2">Manage your grocery listings</p>
          </div>
          <button
            onClick={() => navigate('/add-item')}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
            <Plus className="h-5 w-5" />
            <span>Add New Item</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expiring}</p>
              </div>
              <Clock className="h-10 w-10 text-orange-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setFilter('all')}
              className={`pb-4 px-1 ${
                filter === 'all'
                  ? 'text-green-600 border-b-2 border-green-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`pb-4 px-1 ${
                filter === 'active'
                  ? 'text-green-600 border-b-2 border-green-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => setFilter('expiring')}
              className={`pb-4 px-1 ${
                filter === 'expiring'
                  ? 'text-green-600 border-b-2 border-green-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Expiring Soon ({stats.expiring})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`pb-4 px-1 ${
                filter === 'expired'
                  ? 'text-green-600 border-b-2 border-green-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Expired ({stats.expired})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No items in this category</p>
            <p className="text-gray-400 mt-2">Try switching to a different filter</p>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">You haven't listed any items yet</p>
            <p className="text-gray-400 mt-2">Start sharing your groceries with the community!</p>
            <button
              onClick={() => navigate('/add-item')}
              className="mt-6 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
            >
              Add Your First Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
