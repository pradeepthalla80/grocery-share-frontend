import { useState, useEffect } from 'react';
import { Zap, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { planAdminAPI } from '../api/planAdmin';

export const TestModeBanner = () => {
  const { user, isAuthenticated } = useAuth();
  const [testMode, setTestMode] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      checkTestMode();
    }
  }, [isAuthenticated]);

  const checkTestMode = async () => {
    try {
      const result = await planAdminAPI.getTestModeStatus();
      setTestMode(result.testMode);
    } catch {
    }
  };

  if (!testMode || dismissed || !isAuthenticated) return null;

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="bg-amber-500 text-white text-center py-1.5 px-4 text-xs font-medium flex items-center justify-center gap-2 relative z-[60]">
      <Zap className="h-3.5 w-3.5 flex-shrink-0" />
      <span>
        {isAdmin
          ? 'Test Mode ON — All users have full access to all features'
          : 'All features are currently unlocked for testing'
        }
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-amber-600 rounded"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};
