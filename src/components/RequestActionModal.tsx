import { useState } from 'react';
import { X, MapPin, Truck, MessageSquare, Check, XCircle } from 'lucide-react';
import { AddressInput } from './AddressInput';
import { pickupRequestsAPI, type PickupRequest } from '../api/pickupRequests';
import { useToast } from '../hooks/useToast';

interface RequestActionModalProps {
  request: PickupRequest;
  onClose: () => void;
  onSuccess: () => void;
}

export const RequestActionModal: React.FC<RequestActionModalProps> = ({
  request,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'accept' | 'decline' | null>(null);
  
  // Accept form state
  const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [instructions, setInstructions] = useState('');
  
  // Decline form state
  const [declineReason, setDeclineReason] = useState('');

  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setAddress(location.address);
    setLat(location.lat);
    setLng(location.lng);
  };

  const handleAccept = async () => {
    if (!address || !lat || !lng) {
      showToast('Please select a pickup/delivery address', 'error');
      return;
    }

    setLoading(true);
    try {
      await pickupRequestsAPI.accept(request.id, {
        deliveryMode,
        address,
        instructions: instructions.trim() || undefined,
      });
      
      showToast('✅ Request accepted! Buyer will be notified.', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Accept request error:', error);
      showToast(error.response?.data?.error || 'Failed to accept request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await pickupRequestsAPI.decline(request.id, {
        reason: declineReason.trim() || undefined,
      });
      
      showToast('Request declined', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Decline request error:', error);
      showToast(error.response?.data?.error || 'Failed to decline request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pickup Request</h2>
            <p className="text-sm text-gray-600 mt-1">
              From {request.requester.name} for "{request.item.name}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Item Info */}
          <div className="flex items-center space-x-4 bg-gray-50 rounded-lg p-4">
            {request.item.imageURL && (
              <img
                src={request.item.imageURL}
                alt={request.item.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{request.item.name}</h3>
              <p className="text-sm text-gray-600">
                {request.item.isFree ? '🆓 Free' : `$${request.item.price.toFixed(2)}`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Requested by: {request.requester.name}
              </p>
            </div>
          </div>

          {/* Action Selection */}
          {!action && (
            <div className="space-y-4">
              <p className="text-gray-700">What would you like to do with this request?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setAction('accept')}
                  className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition"
                >
                  <Check className="h-5 w-5" />
                  <span>Accept Request</span>
                </button>
                <button
                  onClick={() => setAction('decline')}
                  className="flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition"
                >
                  <XCircle className="h-5 w-5" />
                  <span>Decline Request</span>
                </button>
              </div>
            </div>
          )}

          {/* Accept Form */}
          {action === 'accept' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ Accept Request</h3>
                <p className="text-sm text-green-700">
                  Provide pickup or delivery details for the buyer
                </p>
              </div>

              {/* Delivery Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Delivery Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDeliveryMode('pickup')}
                    className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border-2 transition ${
                      deliveryMode === 'pickup'
                        ? 'border-green-600 bg-green-50 text-green-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <MapPin className="h-5 w-5" />
                    <span className="font-medium">Pickup at My Location</span>
                  </button>
                  <button
                    onClick={() => setDeliveryMode('delivery')}
                    className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border-2 transition ${
                      deliveryMode === 'delivery'
                        ? 'border-green-600 bg-green-50 text-green-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <Truck className="h-5 w-5" />
                    <span className="font-medium">I'll Deliver to Buyer</span>
                  </button>
                </div>
              </div>

              {/* Address Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {deliveryMode === 'pickup' ? 'Pickup Address' : 'Your Delivery Starting Point'}
                </label>
                <AddressInput onLocationSelect={handleLocationSelect} />
                <p className="text-xs text-gray-500 mt-2">
                  {deliveryMode === 'pickup'
                    ? 'This address will be shared with the buyer for pickup'
                    : 'You will deliver the item to the buyer\'s location'}
                </p>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  Instructions (Optional)
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g., Ring doorbell, parking in back, call when you arrive..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {instructions.length}/500 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleAccept}
                  disabled={loading || !address}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                >
                  {loading ? 'Accepting...' : 'Confirm Accept'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Decline Form */}
          {action === 'decline' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">❌ Decline Request</h3>
                <p className="text-sm text-red-700">
                  Let the buyer know why you can't fulfill this request
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g., Item no longer available, already given to someone else..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {declineReason.length}/200 characters
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleDecline}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-semibold"
                >
                  {loading ? 'Declining...' : 'Confirm Decline'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
