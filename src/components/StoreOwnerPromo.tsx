import { Store, TrendingUp, Package, DollarSign, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';

export const StoreOwnerPromo = () => {
  const navigate = useNavigate();
  const { isStoreOwner } = useStore();

  // Don't show if already a store owner
  if (isStoreOwner) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="bg-blue-600 p-3 rounded-lg">
            <Store className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
            Want to Become a Store Owner?
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            Turn your account into a mini-store and start selling groceries directly to your community. Track inventory, manage sales, and reach more customers!
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-700">
              <Package className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span>Inventory Tracking</span>
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-700">
              <TrendingUp className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span>Sales Dashboard</span>
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-700">
              <DollarSign className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span>Build Revenue</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/profile')}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm min-h-[44px]"
          >
            <span>Learn More</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
