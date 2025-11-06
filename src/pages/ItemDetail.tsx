import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, User, Tag, ChevronLeft, ChevronRight, ZoomIn, MessageCircle, Star, CreditCard, RefreshCw, AlertTriangle, PackageCheck } from 'lucide-react';
import { format } from 'date-fns';
import { itemsAPI, type Item } from '../api/items';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PaymentModal } from '../components/PaymentModal';
import { requestRefund } from '../api/payment';
import { requestPickup } from '../api/notifications';

export const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await itemsAPI.getById(id);
        setItem(data);
        
        if (navigator.geolocation && data.location) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const dist = calculateDistance(
                position.coords.latitude,
                position.coords.longitude,
                data.location.lat,
                data.location.lng
              );
              setDistance(dist);
            },
            () => {
              setDistance(null);
            }
          );
        }
      } catch (error) {
        console.error('Error fetching item:', error);
        showToast('Failed to load item details', 'error');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, navigate, showToast]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const allImages = item?.images && item.images.length > 0 
    ? item.images 
    : item?.imageURL 
    ? [item.imageURL] 
    : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleContactProvider = () => {
    if (item?.user?.id) {
      const message = question.trim() 
        ? `Question about "${item.name}": ${question}` 
        : '';
      navigate(`/chat?receiverId=${item.user.id}&itemId=${item.id}${message ? `&message=${encodeURIComponent(message)}` : ''}`);
    }
  };

  const handleRequestPickup = async () => {
    if (!item) return;
    
    try {
      await requestPickup(item.id);
      showToast('✅ Pickup request sent to the seller! They will contact you soon.', 'success');
    } catch (error) {
      showToast('Failed to send pickup request', 'error');
    }
  };


  const handleRefund = async () => {
    if (!item) return;
    
    setRefundLoading(true);
    try {
      const result = await requestRefund(item.id, refundReason);
      showToast(`Refund processed successfully! Amount: $${result.amount}`, 'success');
      setShowRefundModal(false);
      const data = await itemsAPI.getById(id!);
      setItem(data);
    } catch (error: any) {
      console.error('Refund error:', error);
      showToast(error.response?.data?.error || 'Failed to process refund', 'error');
    } finally {
      setRefundLoading(false);
    }
  };

  const isMyItem = item?.user?.id === user?.id;
  const isBuyer = !isMyItem && (item as any)?.buyerId === user?.id;
  const isSoldItem = (item as any)?.status === 'sold';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Item not found</p>
      </div>
    );
  }

  const timeUntilExpiry = new Date(item.expiryDate).getTime() - new Date().getTime();
  const daysLeft = Math.max(0, Math.floor(timeUntilExpiry / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor((timeUntilExpiry % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const isExpired = timeUntilExpiry <= 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-green-600 hover:text-green-700 transition"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        {isSoldItem && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-900">🛍️ This Item Has Been Sold</p>
              <p className="text-sm text-red-700">This item is no longer available for purchase</p>
            </div>
          </div>
        )}

        {(item as any)?.status === 'refunded' && (
          <div className="mb-6 bg-orange-50 border-2 border-orange-300 rounded-lg p-4 flex items-center gap-3">
            <RefreshCw className="h-6 w-6 text-orange-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-orange-900">💳 This Item Has Been Refunded</p>
              <p className="text-sm text-orange-700">
                The sale was cancelled and the buyer has been refunded
                {(item as any)?.refundReason && `: ${(item as any).refundReason}`}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative">
              {allImages.length > 0 ? (
                <>
                  <div className="relative h-96 bg-gray-200">
                    <img
                      src={allImages[currentImageIndex]}
                      alt={`${item.name} - Image ${currentImageIndex + 1}`}
                      className="w-full h-96 object-cover cursor-pointer"
                      onClick={() => setShowImageModal(true)}
                    />
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
                    >
                      <ZoomIn className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      
                      <div className="p-4 flex space-x-2 overflow-x-auto">
                        {allImages.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                              idx === currentImageIndex ? 'border-green-600' : 'border-gray-300'
                            }`}
                          >
                            <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="h-96 bg-gray-200 flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.name}</h1>
                  {item.category && (
                    <span className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      <Tag className="h-4 w-4 mr-1" />
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {item.isFree ? (
                    <span className="bg-green-100 text-green-700 font-bold px-4 py-2 rounded-lg text-xl">
                      🆓 FREE
                    </span>
                  ) : (
                    <span className="text-3xl font-bold text-green-600">
                      ${item.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {item.tags.map((tag, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3 text-gray-700">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div>
                    <span className="font-semibold">Expires:</span> {format(new Date(item.expiryDate), 'MMM dd, yyyy, h:mm a')}
                    {isExpired ? (
                      <span className="ml-2 text-sm text-red-600 font-semibold">
                        (Expired)
                      </span>
                    ) : (
                      <span className={`ml-2 text-sm ${daysLeft < 1 ? 'text-red-600' : 'text-gray-500'}`}>
                        ({daysLeft > 0 ? `${daysLeft} days` : `${hoursLeft} hours`} left)
                      </span>
                    )}
                  </div>
                </div>

                {distance !== null && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="font-semibold">Distance:</span> {distance.toFixed(1)} miles away
                      {item.location.address && (
                        <span className="block text-sm text-gray-500">{item.location.address}</span>
                      )}
                    </div>
                  </div>
                )}

                {item.pickupTimeStart && item.pickupTimeEnd && !item.flexiblePickup && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Clock className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="font-semibold">Pickup Window:</span>
                      <div className="text-sm">
                        {format(new Date(item.pickupTimeStart), 'MMM dd, h:mm a')} - {format(new Date(item.pickupTimeEnd), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                )}

                {item.flexiblePickup && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Flexible pickup time</span>
                  </div>
                )}

                {item.user && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <User className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="font-semibold">Shared by:</span> {item.user.name}
                      <div className="flex items-center mt-1 space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round((item.user as any)?.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-2">
                          {(item.user as any)?.averageRating 
                            ? `(${((item.user as any).averageRating).toFixed(1)})` 
                            : '(No ratings yet)'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">
                  {item.category ? `${item.category} item` : 'Grocery item'} available for pickup. 
                  {item.isFree ? ' This item is being offered for free!' : ` Available for $${item.price.toFixed(2)}.`}
                  {item.flexiblePickup ? ' Flexible pickup times available.' : ' Please check the pickup window above.'}
                </p>
              </div>

              {!isMyItem && !item.isFree && !isSoldItem && (item as any)?.status !== 'refunded' && (item as any).status === 'available' && (
                <div className="border-t mt-6 pt-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Purchase This Item</h3>
                        <p className="text-sm text-gray-600">Secure payment powered by Stripe</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="text-3xl font-bold text-green-600">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2 font-semibold"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>Buy Now</span>
                    </button>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      🔒 Your payment is secure. You'll receive pickup details after purchase.
                    </p>
                  </div>
                </div>
              )}

              {isBuyer && isSoldItem && (
                <div className="border-t mt-6 pt-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <PackageCheck className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Ready to Pick Up?</h3>
                        <p className="text-sm text-gray-600">Notify the seller you're ready to arrange pickup</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRequestPickup}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 font-semibold"
                    >
                      <PackageCheck className="h-5 w-5" />
                      <span>Request Pickup</span>
                    </button>
                    <p className="text-xs text-blue-600 mt-3 text-center">
                      📍 Seller will be notified and share pickup details with you
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Pickup Issue?</h3>
                        <p className="text-sm text-gray-600">If pickup failed or item is unavailable, request a refund</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition flex items-center justify-center space-x-2 font-semibold"
                    >
                      <RefreshCw className="h-5 w-5" />
                      <span>Request Refund</span>
                    </button>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      💳 Full refund will be processed to your original payment method
                    </p>
                  </div>
                </div>
              )}

              {isMyItem && isSoldItem && (
                <div className="border-t mt-6 pt-6">
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Item No Longer Available?</h3>
                        <p className="text-sm text-gray-600">If you cannot provide this item, cancel and refund the buyer</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition flex items-center justify-center space-x-2 font-semibold"
                    >
                      <RefreshCw className="h-5 w-5" />
                      <span>Cancel & Refund Buyer</span>
                    </button>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      ⚠️ This will cancel the sale and refund the buyer immediately
                    </p>
                  </div>
                </div>
              )}

              {!isMyItem && item.isFree && !isSoldItem && (item as any).status === 'available' && (
                <div className="border-t mt-6 pt-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <PackageCheck className="h-6 w-6 text-green-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Get This Free Item</h3>
                        <p className="text-sm text-gray-600">Send a pickup request to the provider</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRequestPickup}
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2 font-semibold"
                    >
                      <PackageCheck className="h-5 w-5" />
                      <span>Request This Item</span>
                    </button>
                    <p className="text-xs text-green-600 mt-3 text-center">
                      🆓 Provider will be notified and share pickup details
                    </p>
                  </div>
                </div>
              )}

              {!isMyItem && (
                <div className="border-t mt-6 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">💬 Contact Seller</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Have a question? Start a conversation:
                  </p>
                  
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question about this item (optional)..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
                    rows={3}
                  />
                  <button
                    onClick={handleContactProvider}
                    className="w-full bg-gray-700 text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition flex items-center justify-center space-x-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Start Conversation</span>
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Address will be revealed only after both parties agree
                  </p>
                </div>
              )}

              {isMyItem && (
                <div className="border-t mt-6 pt-6 bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 text-center">
                    This is your item listing
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-5xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl"
            >
              ×
            </button>
            <img
              src={allImages[currentImageIndex]}
              alt={item.name}
              className="max-w-full max-h-[90vh] object-contain"
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-30 text-white p-3 rounded-full hover:bg-opacity-50 transition"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-30 text-white p-3 rounded-full hover:bg-opacity-50 transition"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {item && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          itemId={item.id}
          itemName={item.name}
          itemPrice={item.price}
          onSuccess={async () => {
            const data = await itemsAPI.getById(id!);
            setItem(data);
          }}
        />
      )}

      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <RefreshCw className="h-6 w-6 text-orange-600" />
              {isBuyer ? 'Request Refund' : 'Cancel & Refund Buyer'}
            </h3>
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-orange-900 font-semibold mb-2">⚠️ Important</p>
              <ul className="list-disc list-inside text-orange-800 text-sm space-y-1">
                <li>Full refund will be processed immediately</li>
                <li>Item status will be marked as refunded</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for refund (optional):
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={isBuyer ? "e.g., Pickup failed, item not available..." : "e.g., Item spoiled, cannot provide..."}
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                disabled={refundLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={refundLoading}
              >
                {refundLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    Process Refund
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
