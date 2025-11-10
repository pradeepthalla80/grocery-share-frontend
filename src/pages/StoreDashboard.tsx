import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Package, DollarSign, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useToast } from '../hooks/useToast';
import { itemsAPI } from '../api/items';

export const StoreDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isStoreOwner, isStoreMode, storeName, storeItems, transactions, loading, refreshStoreItems } = useStore();
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isStoreOwner) {
      showToast('Store Mode not activated', 'error');
      navigate('/profile');
      return;
    }

    if (!isStoreMode) {
      showToast('Please enable Store Mode first', 'error');
      navigate('/profile');
      return;
    }
  }, [isStoreOwner, isStoreMode, navigate]);

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      setDeleteLoading(itemId);
      await itemsAPI.delete(itemId);
      showToast('Item deleted successfully', 'success');
      refreshStoreItems();
    } catch (error) {
      showToast('Failed to delete item', 'error');
    } finally {
      setDeleteLoading(null);
    }
  };

  if (!isStoreOwner || !isStoreMode) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Store className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{storeName}</h1>
              <p className="text-sm sm:text-base text-blue-100">Store Owner Dashboard</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Items</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{storeItems.length}</p>
              </div>
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {transactions?.totalSales || 0}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ${transactions?.totalRevenue.toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
            </div>
          </div>
        </div>

        {/* Inventory Section */}
        <div className="bg-white rounded-lg shadow mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              <span>Inventory</span>
            </h2>
            <button
              onClick={() => navigate('/add-item?isStoreItem=true')}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium min-h-[44px]"
            >
              <Plus className="h-5 w-5" />
              <span>Add Store Item</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : storeItems.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Package className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No items yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">Start by adding your first store item</p>
              <button
                onClick={() => navigate('/add-item?isStoreItem=true')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium min-h-[44px]"
              >
                <Plus className="h-5 w-5" />
                <span>Add Store Item</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 hidden sm:table-header-group">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {storeItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 flex flex-col sm:table-row border-b sm:border-0">
                      {/* Mobile Card Layout */}
                      <td className="px-4 py-4 sm:px-6 flex sm:table-cell items-center space-x-3">
                        <img
                          src={item.imageURL || '/placeholder.png'}
                          alt={item.name}
                          className="h-12 w-12 sm:h-10 sm:w-10 rounded object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                          <div className="text-xs text-gray-600 sm:hidden">
                            ${item.price.toFixed(2)} • Stock: {item.quantity} • {item.stockStatus?.replace('_', ' ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm text-gray-900">${item.price.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm text-gray-900">{item.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.stockStatus === 'in_stock' ? 'bg-green-100 text-green-800' :
                          item.stockStatus === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                          item.stockStatus === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.stockStatus?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium flex sm:table-cell space-x-2">
                        <button
                          onClick={() => navigate(`/items/${item.id}`)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1 flex-1 sm:flex-none justify-center sm:justify-start px-3 py-2 sm:p-0 bg-blue-50 sm:bg-transparent rounded-lg sm:rounded-none"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deleteLoading === item.id}
                          className="text-red-600 hover:text-red-900 flex items-center space-x-1 flex-1 sm:flex-none justify-center sm:justify-start px-3 py-2 sm:p-0 bg-red-50 sm:bg-transparent rounded-lg sm:rounded-none disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>{deleteLoading === item.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
