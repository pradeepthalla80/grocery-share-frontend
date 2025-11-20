import { ShoppingCart } from 'lucide-react';

interface StoreFilterToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  count?: number;
}

export const StoreFilterToggle: React.FC<StoreFilterToggleProps> = ({ enabled, onChange, count }) => {
  return (
    <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <ShoppingCart className={`h-3 w-3 flex-shrink-0 ${enabled ? 'text-blue-600' : 'text-gray-500'}`} />
          <span className="text-xs font-medium text-gray-900">
            Store Items Only
          </span>
          {count !== undefined && enabled && (
            <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-medium">
              {count}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-0.5 ml-5">
          {enabled ? 'Marketplace only' : 'All items'}
        </p>
      </div>

      {/* Toggle Switch */}
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0 ml-2 ${
          enabled ? 'bg-blue-600' : 'bg-gray-300'
        }`}
        aria-label="Toggle store items filter"
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
};
