import { useState } from 'react';
import { X, DollarSign, Gift } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    _id: string;
    itemName: string;
    pricePreference?: 'free_only' | 'willing_to_pay';
    maxPrice?: number;
    user: {
      id: string;
      name: string;
    };
  };
}

export const OfferModal = ({ isOpen, onClose, request }: OfferModalProps) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [offerType, setOfferType] = useState<'free' | 'paid'>('free');
  const [offerPrice, setOfferPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [offerDelivery, setOfferDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('free');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (offerType === 'paid') {
      const price = parseFloat(offerPrice);
      
      if (isNaN(price) || price <= 0) {
        showToast('Please enter a valid price', 'error');
        return;
      }

      if (request.pricePreference === 'willing_to_pay' && request.maxPrice && price > request.maxPrice) {
        showToast(`Price must be within requester's budget ($${request.maxPrice.toFixed(2)})`, 'error');
        return;
      }

      if (request.pricePreference === 'free_only') {
        showToast('This requester is only looking for free donations', 'error');
        return;
      }

      // TODO: Implement payment flow for paid offers
      const deliveryInfo = offerDelivery 
        ? `(${deliveryFee === 'free' ? 'Free delivery available' : `$${deliveryFee} delivery available`})`
        : '';
      const offerMessage = `I can offer "${request.itemName}" for $${price.toFixed(2)}. ${deliveryInfo}`;
      
      showToast(`Payment integration for request offers coming soon! Price: $${price.toFixed(2)}`, 'info');
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onClose();
        // Navigate to chat with offer details
        navigate(`/chat?receiverId=${request.user.id}&message=${encodeURIComponent(offerMessage)}`);
      }, 1500);
    } else {
      // Free offer - notify and coordinate with delivery info
      const deliveryInfo = offerDelivery 
        ? (deliveryFee === 'free' ? ' I can offer free delivery!' : ` I can deliver for $${deliveryFee}.`)
        : '';
      const offerMessage = `I can offer you "${request.itemName}" for free!${deliveryInfo}`;
      
      showToast('Offer sent! Start a conversation to coordinate pickup.', 'success');
      onClose();
      navigate(`/chat?receiverId=${request.user.id}&message=${encodeURIComponent(offerMessage)}`);
    }
  };

  const canOfferPaid = request.pricePreference === 'willing_to_pay' && request.maxPrice && request.maxPrice > 0;
  const mustOfferFree = request.pricePreference === 'free_only';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Make an Offer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{request.itemName}</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Requester's Preference:</span>
              </p>
              {request.pricePreference === 'free_only' ? (
                <p className="text-sm text-green-600 font-semibold mt-1">
                  🆓 Looking for FREE donations only
                </p>
              ) : request.pricePreference === 'willing_to_pay' ? (
                <p className="text-sm text-blue-600 font-semibold mt-1">
                  💰 Willing to pay up to ${request.maxPrice?.toFixed(2) || '0.00'}
                </p>
              ) : (
                <p className="text-sm text-gray-600 mt-1">
                  No price preference set
                </p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your Offer
            </label>
            
            <div className="space-y-3">
              {/* Free Offer Option */}
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                offerType === 'free' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="offerType"
                  value="free"
                  checked={offerType === 'free'}
                  onChange={() => setOfferType('free')}
                  className="h-4 w-4 text-green-600"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-gray-900">Offer for Free</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Donate this item at no cost
                  </p>
                </div>
              </label>

              {/* Paid Offer Option */}
              {canOfferPaid && (
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                  offerType === 'paid' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="offerType"
                    value="paid"
                    checked={offerType === 'paid'}
                    onChange={() => setOfferType('paid')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">Set a Price</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Charge up to ${request.maxPrice?.toFixed(2)}
                    </p>
                  </div>
                </label>
              )}

              {mustOfferFree && offerType === 'paid' && (
                <p className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded p-3">
                  ⚠️ This requester is only accepting free donations
                </p>
              )}
            </div>
          </div>

          {/* Price Input for Paid Offers */}
          {offerType === 'paid' && canOfferPaid && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 text-lg">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  max={request.maxPrice}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be ${request.maxPrice?.toFixed(2)} or less
              </p>
            </div>
          )}

          {/* Delivery Options */}
          <div className="mb-6 border-t pt-4">
            <label className="flex items-center space-x-2 mb-3">
              <input
                type="checkbox"
                checked={offerDelivery}
                onChange={(e) => setOfferDelivery(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Offer Delivery/Drop-off</span>
            </label>

            {offerDelivery && (
              <div className="ml-6 space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Fee
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="free"
                      checked={deliveryFee === 'free'}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">🚚 Free Delivery</span>
                  </label>
                  {['1', '2', '3', '4', '5'].map((fee) => (
                    <label key={fee} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value={fee}
                        checked={deliveryFee === fee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">${fee} Delivery Fee</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition ${
                offerType === 'free'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {loading ? 'Processing...' : offerType === 'free' ? 'Offer for Free' : 'Continue to Payment'}
            </button>
          </div>

          {offerType === 'free' && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              You'll be redirected to chat to coordinate pickup details
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
