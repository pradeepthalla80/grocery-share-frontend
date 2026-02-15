import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/config';
import { ArrowLeft, Store, Package, TrendingUp, Settings } from 'lucide-react';

export const MyStore = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreItems = async () => {
      try {
        const response = await apiClient.get('/store/my-store');
        setStoreItems(response.data.items || []);
      } catch (err) {
        console.error('Failed to fetch store items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreItems();
  }, []);

  if (!user?.isStoreOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Store className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Store Mode Not Active</h2>
          <p className="text-sm text-gray-500 mb-4">You need to activate store mode to access this page.</p>
          <button
            onClick={() => navigate('/store-setup')}
            className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition"
          >
            Become a Store Owner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="hidden md:flex mb-6 items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-5 md:p-6 text-white mb-4 md:mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{user?.storeName || 'My Store'}</h1>
                <p className="text-purple-200 text-sm">Store Owner Dashboard</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4 md:mb-6">
          <div className="bg-white rounded-xl p-3 md:p-4 text-center border border-gray-100">
            <Package className="h-5 w-5 mx-auto text-purple-600 mb-1" />
            <p className="text-lg md:text-xl font-bold text-gray-900">{storeItems.length}</p>
            <p className="text-[10px] md:text-xs text-gray-500">Products</p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 text-center border border-gray-100">
            <TrendingUp className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-lg md:text-xl font-bold text-gray-900">-</p>
            <p className="text-[10px] md:text-xs text-gray-500">Sales</p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 text-center border border-gray-100">
            <Settings className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <p className="text-lg md:text-xl font-bold text-gray-900">Active</p>
            <p className="text-[10px] md:text-xs text-gray-500">Status</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Store Items</h2>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="skeleton w-16 h-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : storeItems.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium mb-1">No store items yet</p>
              <p className="text-sm text-gray-400 mb-4">Add items to your store inventory</p>
              <button
                onClick={() => navigate('/add-item')}
                className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition"
              >
                Add Store Item
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {storeItems.map((item: any) => (
                <div
                  key={item._id || item.id}
                  onClick={() => navigate(`/item/${item._id || item.id}`)}
                  className="flex items-center gap-3 p-3 md:p-4 active:bg-gray-50 transition cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.images?.[0] || item.imageURL ? (
                      <img src={item.images?.[0] || item.imageURL} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="h-5 w-5 text-gray-300" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.isFree ? 'Free' : `$${item.price?.toFixed(2)}`}</p>
                  </div>
                  <div className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                    Store
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
