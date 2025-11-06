import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Package, User, ChevronLeft, MessageCircle, Edit, Trash2, Star, PackageCheck, Heart, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { getRequestById, deleteRequest, type ItemRequest } from '../api/itemRequests';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../hooks/useToast';
import { sendInterestNotification } from '../api/notifications';
import { OfferModal } from '../components/OfferModal';

export const RequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canDeleteAnyContent } = useAdmin();
  const { showToast } = useToast();
  
  const [request, setRequest] = useState<ItemRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getRequestById(id);
        setRequest(data);
        
        // Calculate distance from user location
        if (navigator.geolocation && data.location) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const dist = calculateDistance(
                position.coords.latitude,
                position.coords.longitude,
                data.location.coordinates[1],
                data.location.coordinates[0]
              );
              setDistance(dist);
            },
            () => {
              setDistance(null);
            }
          );
        }
      } catch (error) {
        console.error('Error fetching request:', error);
        showToast('Failed to load request details', 'error');
        navigate('/item-requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, navigate, showToast]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleContactRequester = () => {
    if (request?.user?.id) {
      const message = `I have a question about your request for "${request.itemName}"`;
      navigate(`/chat?receiverId=${request.user.id}&message=${encodeURIComponent(message)}`);
    }
  };

  const handleInterestNotification = async () => {
    if (!request) return;
    
    try {
      await sendInterestNotification(request._id, request.itemName, 'request');
      showToast('✅ Requester notified of your interest! They may reach out soon.', 'success');
    } catch (error) {
      showToast('Failed to send interest notification', 'error');
    }
  };

  const handleEdit = () => {
    navigate(`/item-requests?edit=${id}`);
  };

  const handleDelete = async () => {
    if (!request) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this request?');
    if (!confirmed) return;

    try {
      await deleteRequest(request._id);
      showToast('Request deleted successfully', 'success');
      navigate('/item-requests');
    } catch (error) {
      showToast('Failed to delete request', 'error');
    }
  };

  const handleAdminDelete = async () => {
    if (!request) return;
    
    if (!confirm(`⚠️ ADMIN ACTION\n\nAre you sure you want to delete this request for "${request.itemName}"?\n\nThis action cannot be undone and will:\n- Permanently remove the request\n- Notify the requester\n- Delete all responses`)) {
      return;
    }
    
    try {
      await deleteRequest(request._id);
      showToast('Request deleted successfully (Admin)', 'success');
      navigate('/admin');
    } catch (error) {
      showToast('Failed to delete request', 'error');
    }
  };

  const isMyRequest = request?.user?.id === user?.id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Request not found</p>
      </div>
    );
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    fulfilled: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-green-600 hover:text-green-700 transition"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{request.itemName}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[request.status]}`}>
                    {request.status.toUpperCase()}
                  </span>
                </div>
                {request.category && (
                  <span className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    <Package className="h-4 w-4 mr-1" />
                    {request.category}
                  </span>
                )}
              </div>

              {isMyRequest && request.status === 'active' && (
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3 text-gray-700">
                <Package className="h-5 w-5 text-green-600" />
                <div>
                  <span className="font-semibold">Quantity:</span> {request.quantity}
                </div>
              </div>

              {request.pricePreference && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <Star className="h-5 w-5 text-green-600" />
                  <div>
                    <span className="font-semibold">Payment:</span>{' '}
                    {request.pricePreference === 'free_only' ? (
                      <span className="text-green-600 font-semibold">🆓 Looking for FREE donations</span>
                    ) : (
                      <span>
                        Willing to pay up to{' '}
                        <span className="text-green-600 font-semibold">${request.maxPrice?.toFixed(2) || '0.00'}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 text-gray-700">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <span className="font-semibold">Posted:</span> {format(new Date(request.createdAt), 'MMM dd, yyyy, h:mm a')}
                </div>
              </div>

              {distance !== null && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <div>
                    <span className="font-semibold">Distance:</span> {distance.toFixed(1)} miles away
                    {request.approximateLocation && (
                      <span className="block text-sm text-gray-500">{request.approximateLocation}</span>
                    )}
                  </div>
                </div>
              )}

              {request.user && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <User className="h-5 w-5 text-green-600" />
                  <div>
                    <span className="font-semibold">Requested by:</span> {request.user.name}
                    <div className="flex items-center mt-1 space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round((request.user as any)?.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">
                        {(request.user as any)?.averageRating 
                          ? `(${((request.user as any).averageRating).toFixed(1)})` 
                          : '(No ratings yet)'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {request.notes && (
              <div className="border-t pt-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Additional Notes</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{request.notes}</p>
              </div>
            )}

            {request.responses && request.responses.length > 0 && (
              <div className="border-t pt-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Responses ({request.responses.length})
                </h2>
                <div className="space-y-3">
                  {request.responses.map((response, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{response.user.name}</span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(response.createdAt), 'MMM dd, h:mm a')}
                        </span>
                      </div>
                      <p className="text-gray-700">{response.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isMyRequest && request.status === 'active' && (
              <div className="border-t pt-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Heart className="h-6 w-6 text-purple-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Interested in Helping?</h3>
                      <p className="text-sm text-gray-600">Let the requester know you can help</p>
                    </div>
                  </div>
                  <button
                    onClick={handleInterestNotification}
                    className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition flex items-center justify-center space-x-2 font-semibold"
                  >
                    <Heart className="h-5 w-5" />
                    <span>Interested to Offer</span>
                  </button>
                  <p className="text-xs text-purple-600 mt-3 text-center">
                    💜 Requester will be notified without revealing your contact info
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <PackageCheck className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Can You Help?</h3>
                      <p className="text-sm text-gray-600">Offer this item to the requester</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 font-semibold"
                  >
                    <PackageCheck className="h-5 w-5" />
                    <span>Make an Offer</span>
                  </button>
                  <p className="text-xs text-blue-600 mt-3 text-center">
                    {request.pricePreference === 'free_only' 
                      ? '🆓 This requester is looking for free donations'
                      : request.pricePreference === 'willing_to_pay'
                      ? `💰 Willing to pay up to $${request.maxPrice?.toFixed(2) || '0.00'}`
                      : '🤝 Choose to offer free or set a price'
                    }
                  </p>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">💬 Or Just Chat</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Have questions? Start a conversation:
                </p>
                
                <button
                  onClick={handleContactRequester}
                  className="w-full bg-gray-700 text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Start Conversation</span>
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Address will be revealed after both parties agree
                </p>
              </div>
            )}

            {isMyRequest && (
              <div className="border-t pt-6 bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 text-center">
                  This is your request. {request.responses?.length || 0} {request.responses?.length === 1 ? 'person has' : 'people have'} responded.
                </p>
              </div>
            )}

            {canDeleteAnyContent && !isMyRequest && (
              <div className="border-t mt-6 pt-6">
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-6 w-6 text-red-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Admin Controls</h3>
                      <p className="text-sm text-red-600">Admin-only delete function</p>
                    </div>
                  </div>
                  <button
                    onClick={handleAdminDelete}
                    className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition flex items-center justify-center space-x-2 font-semibold"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span>Delete Request (Admin)</span>
                  </button>
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    ⚠️ This action is permanent and will be logged
                  </p>
                </div>
              </div>
            )}

            {request.status !== 'active' && (
              <div className="border-t pt-6 bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 text-center">
                  This request is {request.status}. {request.status === 'fulfilled' ? 'The item has been received.' : 'The request has been cancelled.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offer Modal */}
      {request && (
        <OfferModal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          request={request}
        />
      )}
    </div>
  );
};
