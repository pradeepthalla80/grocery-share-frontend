import { ShoppingCart } from 'lucide-react';

interface StoreFilterToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  count?: number;
}

export const StoreFilterToggle: React.FC<StoreFilterToggleProps> = ({ enabled, onChange, count }) => {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${enabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
          <ShoppingCart className={`h-5 w-5 ${enabled ? 'text-blue-600' : 'text-gray-600'}`} />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm sm:text-base font-medium text-gray-900">
              Show Only Store Items
            </span>
            {count !== undefined && enabled && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                {count}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-0.5">
            {enabled ? 'Showing marketplace items only' : 'Showing all items (community + marketplace)'}
          </p>
        </div>
      </div>

      {/* Toggle Switch */}
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-7 w-12 sm:h-8 sm:w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          enabled ? 'bg-blue-600' : 'bg-gray-300'
        }`}
        aria-label="Toggle store items filter"
      >
        <span
          className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white shadow-lg transition-transform ${
            enabled ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};
