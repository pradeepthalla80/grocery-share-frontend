import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/config';
import { useToast } from '../hooks/useToast';
import { ArrowLeft, Store, CheckCircle, FileText } from 'lucide-react';

export const StoreSetup = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [terms, setTerms] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (user?.isStoreOwner) {
      navigate('/my-store');
      return;
    }

    const fetchTerms = async () => {
      try {
        const response = await apiClient.get('/store/terms');
        setTerms(response.data.terms || 'Store owner terms and conditions will be displayed here.');
      } catch (err) {
        console.error('Failed to fetch terms:', err);
        setTerms('Store owner terms and conditions will be displayed here.');
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, [user?.isStoreOwner]);

  const handleActivate = async () => {
    if (!storeName.trim()) {
      showToast('Please enter your store name', 'error');
      return;
    }
    if (!acceptedTerms) {
      showToast('Please accept the terms and conditions', 'error');
      return;
    }

    try {
      setActivating(true);
      const response = await apiClient.post('/store/activate', {
        storeName: storeName.trim(),
        acceptTerms: true,
      });
      
      const token = localStorage.getItem('grocery_share_token');
      if (token && response.data.user) {
        login(token, response.data.user);
      }
      
      showToast('Store mode activated! Welcome aboard!', 'success');
      navigate('/my-store');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to activate store mode', 'error');
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-lg mx-auto px-4 py-4 md:py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 md:mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-600 to-green-700 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="w-16 h-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-3">
              <Store className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-bold">Become a Store Owner</h1>
            <p className="text-green-100 text-sm mt-1">Set up your store and start selling on BaskMate</p>
          </div>

          <div className="p-4 md:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Enter your store name"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Terms & Conditions</h3>
              </div>
              <div className="max-h-40 overflow-y-auto text-xs text-gray-600 leading-relaxed native-scroll">
                {loading ? (
                  <div className="space-y-2">
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-3/4" />
                    <div className="skeleton h-3 w-5/6" />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{terms}</p>
                )}
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-xs text-gray-600">
                I agree to the Store Owner Terms & Conditions and understand the platform commission structure.
              </span>
            </label>

            <div className="bg-green-50 border border-green-100 rounded-xl p-3.5">
              <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                What you get:
              </h4>
              <ul className="space-y-1.5 text-xs text-green-700">
                <li>&#8226; Dedicated store dashboard & analytics</li>
                <li>&#8226; Inventory management tools</li>
                <li>&#8226; Store badge on all your listings</li>
                <li>&#8226; Priority visibility in search results</li>
              </ul>
            </div>

            <button
              onClick={handleActivate}
              disabled={activating || !storeName.trim() || !acceptedTerms}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition disabled:opacity-50"
            >
              {activating ? 'Activating...' : 'Activate Store Mode'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
