import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Calendar, MapPin, FileText } from 'lucide-react';
import { storeAPI, type StoreAgreement } from '../api/store';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

export const LegalAgreements = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [agreement, setAgreement] = useState<StoreAgreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullTerms, setShowFullTerms] = useState(false);

  useEffect(() => {
    if (!user?.isStoreOwner) {
      showToast('No agreements found', 'info');
      navigate('/profile');
      return;
    }

    fetchAgreement();
  }, [user, navigate]);

  const fetchAgreement = async () => {
    try {
      setLoading(true);
      const data = await storeAPI.getMyAgreement();
      setAgreement(data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        showToast('No agreements found', 'info');
      } else {
        showToast('Failed to load agreement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Agreements Found</h2>
            <p className="text-gray-600 mb-6">You haven't accepted any legal agreements yet.</p>
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Legal Agreements</h1>
              <p className="text-sm sm:text-base text-purple-100">View your accepted terms and agreements</p>
            </div>
          </div>
        </div>

        {/* Agreement Card */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              <span>Store Owner Terms & Agreement</span>
            </h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Agreement Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600">Accepted On</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {new Date(agreement.agreedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600">IP Address</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {agreement.ipAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600">Version</p>
                  <p className="text-sm font-medium text-gray-900">
                    {agreement.version}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600">Status</p>
                  <p className="text-sm font-medium text-green-600">
                    Accepted
                  </p>
                </div>
              </div>
            </div>

            {/* Terms Content */}
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowFullTerms(!showFullTerms)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>{showFullTerms ? 'Hide' : 'View'} Full Agreement Text</span>
              </button>

              {showFullTerms && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-700 font-sans leading-relaxed">
                    {agreement.termsContent}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 mb-1">Legal Compliance Record</h3>
              <p className="text-xs sm:text-sm text-yellow-700">
                This is your legal record of accepting the Store Owner Terms & Agreement. 
                This information is stored securely for compliance purposes and cannot be deleted. 
                If you have questions about these terms, please contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
