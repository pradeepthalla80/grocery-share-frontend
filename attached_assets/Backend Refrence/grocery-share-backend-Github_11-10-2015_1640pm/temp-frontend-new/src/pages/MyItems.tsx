import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI, type Item } from '../api/items';
import { ItemCard } from '../components/ItemCard';
import { Plus, Package } from 'lucide-react';

export const MyItems = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

        <div className="mb-4">
          <p className="text-gray-600">
            You have <span className="font-semibold">{items.length}</span> active listings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              showActions
              onEdit={() => handleEdit(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>

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
