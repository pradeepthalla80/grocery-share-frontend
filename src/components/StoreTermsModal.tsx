import { useState, useEffect } from 'react';
import { X, Store, AlertCircle } from 'lucide-react';
import { storeAPI } from '../api/store';
import { useToast } from '../hooks/useToast';

interface StoreTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const StoreTermsModal: React.FC<StoreTermsModalProps> = ({ isOpen, onClose, onAccept }) => {
  const { showToast } = useToast();
  const [storeName, setStoreName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTerms, setLoadingTerms] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchTerms();
    }
  }, [isOpen]);

  const fetchTerms = async () => {
    try {
      setLoadingTerms(true);
      const data = await storeAPI.getTerms();
      setTermsContent(data.terms);
    } catch (error) {
      showToast('Failed to load terms', 'error');
    } finally {
      setLoadingTerms(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeName.trim()) {
      showToast('Please enter a store name', 'error');
      return;
    }

    if (!acceptedTerms) {
      showToast('You must accept the terms to continue', 'error');
      return;
    }

    try {
      setLoading(true);
      await storeAPI.activateStoreMode(storeName.trim(), true);
      showToast('Store Mode activated successfully!', 'success');
      onAccept();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to activate Store Mode', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Store Owner Agreement</h2>
              <p className="text-sm text-gray-600 mt-1">Please review and accept the terms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Terms Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loadingTerms ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
              <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-700 font-sans leading-relaxed">
                {termsContent}
              </pre>
            </div>
          )}

          {/* Store Name Input */}
          <div className="mb-6">
            <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              placeholder="Enter your store name"
              maxLength={50}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">{storeName.length}/50 characters</p>
          </div>

          {/* Agreement Checkbox */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                disabled={loading}
              />
              <label htmlFor="acceptTerms" className="flex-1 cursor-pointer">
                <span className="text-sm text-gray-900 font-medium">
                  I have read and agree to the Store Owner Terms & Agreement
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  By checking this box, you confirm that you understand your responsibilities as a store owner and agree to comply with all terms.
                </p>
              </label>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="flex items-start space-x-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p>
              Your IP address and acceptance timestamp will be recorded for legal compliance. You can view your agreement details in your profile settings under Legal &gt; Agreements.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium min-h-[44px]"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!acceptedTerms || !storeName.trim() || loading}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {loading ? 'Activating...' : 'Activate Store Mode'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
