import { useState, useEffect } from 'react';
import { Clock, Package, CheckCircle, XCircle, Truck, MapPin, Star } from 'lucide-react';
import { pickupRequestsAPI, type PickupRequest } from '../api/pickupRequests';
import { RequestActionModal } from '../components/RequestActionModal';
import { RatingModal } from '../components/RatingModal';
import { useToast } from '../hooks/useToast';
import { format } from 'date-fns';

export const PickupRequests = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sellerRequests, setSellerRequests] = useState<PickupRequest[]>([]);
  const [buyerRequests, setBuyerRequests] = useState<PickupRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'selling' | 'buying'>('selling');
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    rateeId: string;
    rateeName: string;
    itemId: string;
  } | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [sellerRes, buyerRes] = await Promise.all([
        pickupRequestsAPI.getAll({ role: 'seller' }),
        pickupRequestsAPI.getAll({ role: 'requester' }),
      ]);
      
      setSellerRequests(sellerRes.requests);
      setBuyerRequests(buyerRes.requests);
    } catch (error) {
      console.error('Fetch requests error:', error);
      showToast('Failed to load pickup requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleConfirmCompletion = async (requestId: string) => {
    try {
      await pickupRequestsAPI.confirm(requestId);
      showToast('✅ Pickup confirmed!', 'success');
      fetchRequests();
    } catch (error: any) {
      console.error('Confirm error:', error);
      showToast(error.response?.data?.error || 'Failed to confirm', 'error');
    }
  };

  const getStatusBadge = (status: PickupRequest['status']) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      declined: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Declined' },
      canceled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Canceled' },
      awaiting_pickup: { color: 'bg-blue-100 text-blue-800', icon: Package, label: 'Awaiting Pickup' },
      completed: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, label: 'Completed' },
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3" />
        <span>{badge.label}</span>
      </span>
    );
  };

  const RequestCard: React.FC<{ request: PickupRequest; role: 'seller' | 'buyer' }> = ({ request, role }) => {
    const isSeller = role === 'seller';
    const otherParty = isSeller ? request.requester : request.seller;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            {request.item.imageURL && (
              <img
                src={request.item.imageURL}
                alt={request.item.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{request.item.name}</h3>
              <p className="text-sm text-gray-600">
                {isSeller ? 'Requested by' : 'From'}: {otherParty.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(request.createdAt), 'MMM dd, yyyy h:mm a')}
              </p>
            </div>
          </div>
          {getStatusBadge(request.status)}
        </div>

        {/* Address Info (shown after acceptance) */}
        {request.status === 'awaiting_pickup' && request.sellerAddress && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-2">
              {request.deliveryMode === 'pickup' ? (
                <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <Truck className="h-5 w-5 text-green-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium text-green-900 text-sm">
                  {request.deliveryMode === 'pickup' ? 'Pickup Address' : 'Delivery Option'}
                </p>
                <p className="text-sm text-green-700 mt-1">{request.sellerAddress}</p>
                {request.sellerInstructions && (
                  <p className="text-xs text-green-600 mt-2 italic">
                    "{request.sellerInstructions}"
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Decline Reason */}
        {request.status === 'declined' && request.declineReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-700">
              <strong>Reason:</strong> {request.declineReason}
            </p>
          </div>
        )}

        {/* Completion Status */}
        {request.status === 'awaiting_pickup' && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`text-center p-3 rounded-lg ${
              request.buyerConfirmed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              <p className="text-xs font-medium">Buyer Confirmed</p>
              <p className="text-lg">{request.buyerConfirmed ? '✅' : '⏳'}</p>
            </div>
            <div className={`text-center p-3 rounded-lg ${
              request.sellerConfirmed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              <p className="text-xs font-medium">Seller Confirmed</p>
              <p className="text-lg">{request.sellerConfirmed ? '✅' : '⏳'}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {isSeller && request.status === 'pending' && (
            <button
              onClick={() => setSelectedRequest(request)}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              Accept / Decline
            </button>
          )}

          {request.status === 'awaiting_pickup' && (
            <>
              {((isSeller && !request.sellerConfirmed) || (!isSeller && !request.buyerConfirmed)) && (
                <button
                  onClick={() => handleConfirmCompletion(request.id)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  ✅ Confirm Pickup Complete
                </button>
              )}
              {((isSeller && request.sellerConfirmed) || (!isSeller && request.buyerConfirmed)) && (
                <div className="flex-1 bg-gray-100 text-gray-600 py-2 px-4 rounded-lg text-center text-sm font-medium">
                  Waiting for other party...
                </div>
              )}
            </>
          )}

          {request.status === 'completed' && (
            <>
              {/* Check if current user needs to rate the other party */}
              {(() => {
                // isSeller is true when role='seller', false when role='buyer'
                const needsToRate = isSeller 
                  ? !request.hasSellerRatedBuyer   // Seller rating buyer
                  : !request.hasBuyerRatedSeller;  // Buyer rating seller
                
                if (needsToRate) {
                  const otherPartyId = isSeller ? request.requester.id : request.seller.id;
                  const otherPartyName = isSeller ? request.requester.name : request.seller.name;
                  
                  return (
                    <button
                      onClick={() => setRatingModal({
                        isOpen: true,
                        rateeId: otherPartyId,
                        rateeName: otherPartyName,
                        itemId: request.item.id
                      })}
                      className="flex-1 bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 transition text-sm font-medium flex items-center justify-center space-x-2"
                    >
                      <Star className="h-4 w-4" />
                      <span>Rate {otherPartyName}</span>
                    </button>
                  );
                } else {
                  return (
                    <div className="flex-1 bg-purple-100 text-purple-800 py-2 px-4 rounded-lg text-center text-sm font-medium">
                      🎉 Exchange Completed!
                    </div>
                  );
                }
              })()}
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const activeRequests = activeTab === 'selling' ? sellerRequests : buyerRequests;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pickup Requests</h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('selling')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'selling'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Selling ({sellerRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('buying')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'buying'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Buying ({buyerRequests.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Requests List */}
        {activeRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Yet</h3>
            <p className="text-gray-600">
              {activeTab === 'selling'
                ? 'When people request your items, they will appear here'
                : 'Your pickup requests will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                role={activeTab === 'selling' ? 'seller' : 'buyer'}
              />
            ))}
          </div>
        )}

        {/* Action Modal */}
        {selectedRequest && (
          <RequestActionModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onSuccess={fetchRequests}
          />
        )}

        {/* Rating Modal */}
        {ratingModal && (
          <RatingModal
            isOpen={ratingModal.isOpen}
            onClose={() => setRatingModal(null)}
            rateeId={ratingModal.rateeId}
            rateeName={ratingModal.rateeName}
            itemId={ratingModal.itemId}
            onSuccess={() => {
              setRatingModal(null);
              fetchRequests(); // Refresh to update rating status
            }}
          />
        )}
      </div>
    </div>
  );
};
