import { useState } from 'react';
import { Store, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';
import { StoreTermsModal } from './StoreTermsModal';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';

export const StoreActivationSection = () => {
  const { checkAuth } = useAuth();
  const { isStoreOwner, isStoreMode, storeName, toggleStoreMode, loading } = useStore();
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleActivateSuccess = async () => {
    await checkAuth(); // Refresh user data
  };

  if (!isStoreOwner) {
    // Show activation card for non-store owners
    return (
      <>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Store className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Become a Store Owner</h3>
              </div>
              
              <p className="text-sm sm:text-base text-gray-700 mb-4">
                Turn your account into a mini-store and start selling groceries directly to your community. 
                Manage inventory, track sales, and reach more customers.
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="flex items-start space-x-2">
                  <ShoppingBag className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Inventory Management</p>
                    <p className="text-xs text-gray-600">Track stock levels easily</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Sales Dashboard</p>
                    <p className="text-xs text-gray-600">Monitor your revenue</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Store className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Store Branding</p>
                    <p className="text-xs text-gray-600">Build your reputation</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2 text-xs text-gray-600 bg-white bg-opacity-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p>
                  You'll need to review and accept the Store Owner Terms & Agreement before activation.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => setShowTermsModal(true)}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium min-h-[44px] shadow-sm"
            >
              Activate Store Mode
            </button>
          </div>
        </div>

        <StoreTermsModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          onAccept={handleActivateSuccess}
        />
      </>
    );
  }

  // Store Owner controls (toggle on/off)
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-lg ${isStoreMode ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Store className={`h-5 w-5 ${isStoreMode ? 'text-green-600' : 'text-gray-600'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Store Owner Mode</h3>
              <p className="text-sm text-gray-600">
                Store: <span className="font-medium text-gray-900">{storeName}</span>
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-2">
            {isStoreMode 
              ? 'Your store is currently active. You can create store items with inventory tracking.'
              : 'Your store is currently disabled. Enable it to start selling again.'}
          </p>

          <div className={`inline-flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-full ${
            isStoreMode 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            <div className={`h-2 w-2 rounded-full ${isStoreMode ? 'bg-green-600' : 'bg-gray-400'}`}></div>
            <span>{isStoreMode ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={toggleStoreMode}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium transition min-h-[44px] disabled:opacity-50 ${
              isStoreMode
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Loading...' : (isStoreMode ? 'Disable Store Mode' : 'Enable Store Mode')}
          </button>
        </div>
      </div>
    </div>
  );
};
