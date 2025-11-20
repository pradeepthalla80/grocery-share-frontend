import { Store, ArrowRight } from 'lucide-react';
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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Store className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900">
              Want to Become a Store Owner?
            </h3>
            <p className="text-xs text-gray-600 hidden sm:block">
              Sell groceries, track inventory, and build revenue
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-xs whitespace-nowrap"
        >
          <span>Learn More</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
