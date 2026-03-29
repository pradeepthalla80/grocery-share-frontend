import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, User, Tag, ChevronLeft, ChevronRight, ZoomIn, MessageCircle, Star, CreditCard, RefreshCw, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { itemsAPI, type Item } from '../api/items';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PaymentModal } from '../components/PaymentModal';
import { requestRefund } from '../api/payment';
import { lookupBarcode, type ProductInfo } from '../api/openFoodFacts';
import { parseLocalDate } from '../utils/date';

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
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [showNutritionDetail, setShowNutritionDetail] = useState(false);
  const [hasBarcode, setHasBarcode] = useState(false);
  const [nutritionFailed, setNutritionFailed] = useState(false);

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

  useEffect(() => {
    if (!item?.tags) return;
    const barcodeTag = item.tags.find(t => t.startsWith('barcode:'));
    if (!barcodeTag) return;
    const barcode = barcodeTag.replace('barcode:', '');
    if (!barcode) return;

    setHasBarcode(true);
    let cancelled = false;
    setNutritionLoading(true);
    setNutritionFailed(false);
    lookupBarcode(barcode).then(info => {
      if (!cancelled) {
        if (info.found) {
          setProductInfo(info);
        } else {
          setNutritionFailed(true);
        }
      }
    }).catch(() => {
      if (!cancelled) setNutritionFailed(true);
    }).finally(() => {
      if (!cancelled) setNutritionLoading(false);
    });

    return () => { cancelled = true; };
  }, [item?.tags]);

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
      <div className="min-h-screen bg-gray-50">
        <div className="md:max-w-6xl md:mx-auto md:px-6 md:py-8">
          <div className="w-full h-72 md:h-96 skeleton" />
          <div className="p-4 space-y-4">
            <div className="h-8 w-3/4 skeleton" />
            <div className="h-5 w-1/2 skeleton" />
            <div className="h-5 w-2/3 skeleton" />
          </div>
        </div>
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

  const timeUntilExpiry = parseLocalDate(item.expiryDate).getTime() - new Date().getTime();
  const daysLeft = Math.max(0, Math.floor(timeUntilExpiry / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor((timeUntilExpiry % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const isExpired = timeUntilExpiry <= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="md:max-w-6xl md:mx-auto md:px-6 md:py-8">
        <button
          onClick={() => navigate(-1)}
          className="hidden md:flex mb-6 items-center text-green-600 hover:text-green-700 transition"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        <div className="fixed top-0 left-0 right-0 md:hidden" style={{ zIndex: 30 }}>
          <div className="flex items-center justify-between p-3 bg-gradient-to-b from-black/50 to-transparent">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center active:bg-black/50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowImageModal(true)}
              className="w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center active:bg-black/50"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isSoldItem && (
          <div className="mx-4 md:mx-0 mt-4 md:mt-0 mb-4 md:mb-6 bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-900 text-sm">This Item Has Been Sold</p>
              <p className="text-xs text-red-700">No longer available for purchase</p>
            </div>
          </div>
        )}

        {(item as any)?.status === 'refunded' && (
          <div className="mx-4 md:mx-0 mt-4 md:mt-0 mb-4 md:mb-6 bg-orange-50 border border-orange-200 rounded-xl p-3.5 flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-orange-900 text-sm">This Item Has Been Refunded</p>
              <p className="text-xs text-orange-700">
                The buyer has been refunded
                {(item as any)?.refundReason && `: ${(item as any).refundReason}`}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-100 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0 md:gap-6">
            <div className="relative">
              {allImages.length > 0 ? (
                <>
                  <div className="relative h-72 md:h-96 bg-gray-100">
                    <img
                      src={allImages[currentImageIndex]}
                      alt={`${item.name} - Image ${currentImageIndex + 1}`}
                      className="w-full h-72 md:h-96 object-cover cursor-pointer"
                      onClick={() => setShowImageModal(true)}
                    />
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="hidden md:flex absolute top-4 right-4 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition items-center justify-center"
                    >
                      <ZoomIn className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full active:bg-black/60 transition"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full active:bg-black/60 transition"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      
                      <div className="p-3 md:p-4 flex space-x-2 overflow-x-auto hide-scrollbar">
                        {allImages.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition ${
                              idx === currentImageIndex ? 'border-green-600' : 'border-gray-200'
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
                <div className="h-72 md:h-96 bg-gray-100 flex items-center justify-center text-gray-300">
                  <div className="text-center">
                    <ZoomIn className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">No Image Available</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1.5">{item.name}</h1>
                  {item.category && (
                    <span className="inline-flex items-center bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                      <Tag className="h-3 w-3 mr-1" />
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="text-right ml-3">
                  {item.isFree ? (
                    <span className="bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-xl text-base md:text-xl">
                      FREE
                    </span>
                  ) : (
                    <span className="text-2xl md:text-3xl font-bold text-green-600">
                      ${item.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {item.tags && item.tags.filter(t => !t.startsWith('barcode:')).length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {item.tags.filter(t => !t.startsWith('barcode:')).map((tag, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-3 mb-5 md:mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Expires {format(parseLocalDate(item.expiryDate), 'MMM dd, yyyy')}</span>
                    {isExpired ? (
                      <span className="ml-2 text-xs text-red-600 font-semibold">(Expired)</span>
                    ) : (
                      <span className={`ml-2 text-xs ${daysLeft < 1 ? 'text-red-600' : 'text-gray-500'}`}>
                        ({daysLeft > 0 ? `${daysLeft}d` : `${hoursLeft}h`} left)
                      </span>
                    )}
                  </div>
                </div>

                {distance !== null && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium">{distance.toFixed(1)} miles away</span>
                      {item.location.address && (
                        <span className="block text-xs text-gray-500">{item.location.address}</span>
                      )}
                    </div>
                  </div>
                )}

                {item.pickupTimeStart && item.pickupTimeEnd && !item.flexiblePickup && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium">Pickup Window</span>
                      <span className="block text-xs text-gray-500">
                        {format(new Date(item.pickupTimeStart), 'MMM dd, h:mm a')} - {format(new Date(item.pickupTimeEnd), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                )}

                {item.flexiblePickup && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium">Flexible pickup time</span>
                  </div>
                )}

                {item.user && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium">{item.user.name}</span>
                      <div className="flex items-center mt-0.5 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.round((item.user as any)?.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
                            }`}
                          />
                        ))}
                        <span className="text-[10px] text-gray-500 ml-1">
                          {(item.user as any)?.averageRating 
                            ? `${((item.user as any).averageRating).toFixed(1)}` 
                            : 'New'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 md:pt-6">
                <h2 className="text-base md:text-xl font-semibold text-gray-900 mb-2 md:mb-4">Description</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description || (
                    <>
                      {item.category ? `${item.category} item` : 'Grocery item'} available for pickup. 
                      {item.isFree ? ' This item is being offered for free!' : ` Available for $${item.price.toFixed(2)}.`}
                      {item.flexiblePickup ? ' Flexible pickup times available.' : ' Please check the pickup window above.'}
                    </>
                  )}
                </p>
              </div>

              {hasBarcode && (
                <div className="border-t border-gray-100 pt-4 md:pt-6">
                  <button
                    onClick={() => !nutritionLoading && setShowNutritionDetail(!showNutritionDetail)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h2 className="text-base md:text-xl font-semibold text-gray-900">Nutrition & Allergens</h2>
                    {nutritionLoading ? (
                      <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                    ) : (
                      showNutritionDetail ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {showNutritionDetail && nutritionFailed && !productInfo && (
                    <div className="mt-3 bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-gray-500">Nutrition information is not available for this product at the moment.</p>
                    </div>
                  )}

                  {showNutritionDetail && productInfo && (
                    <div className="mt-3 space-y-3">
                      {productInfo.nutrition && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-900">Nutrition Facts</span>
                            {productInfo.nutrition.servingSize && (
                              <span className="text-xs text-gray-500">Per {productInfo.nutrition.servingSize}</span>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {productInfo.nutrition.calories != null && (
                              <div className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                                <p className="text-lg font-bold text-gray-900">{Math.round(productInfo.nutrition.calories)}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">Calories</p>
                              </div>
                            )}
                            {productInfo.nutrition.protein != null && (
                              <div className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                                <p className="text-lg font-bold text-blue-600">{productInfo.nutrition.protein}g</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">Protein</p>
                              </div>
                            )}
                            {productInfo.nutrition.carbs != null && (
                              <div className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                                <p className="text-lg font-bold text-amber-600">{productInfo.nutrition.carbs}g</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">Carbs</p>
                              </div>
                            )}
                            {productInfo.nutrition.fat != null && (
                              <div className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                                <p className="text-lg font-bold text-orange-600">{productInfo.nutrition.fat}g</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">Fat</p>
                              </div>
                            )}
                          </div>
                          {(productInfo.nutrition.fiber != null || productInfo.nutrition.sugar != null || productInfo.nutrition.sodium != null) && (
                            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-200">
                              {productInfo.nutrition.fiber != null && (
                                <span className="text-gray-600 text-xs">Fiber: {productInfo.nutrition.fiber}g</span>
                              )}
                              {productInfo.nutrition.sugar != null && (
                                <span className="text-gray-600 text-xs">Sugar: {productInfo.nutrition.sugar}g</span>
                              )}
                              {productInfo.nutrition.sodium != null && (
                                <span className="text-gray-600 text-xs">Sodium: {productInfo.nutrition.sodium}mg</span>
                              )}
                            </div>
                          )}
                          <p className="text-[10px] text-gray-400 mt-2">Source: {productInfo.source || 'Open Food Facts'}</p>
                        </div>
                      )}

                      {productInfo.allergens && productInfo.allergens.length > 0 && (
                        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                          <div className="flex items-center gap-1.5 mb-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-semibold text-red-800">Allergen Information</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {productInfo.allergens.map((allergen, i) => (
                              <span key={i} className="inline-block bg-white text-red-700 text-xs px-2.5 py-1 rounded-lg border border-red-200 font-medium">
                                {allergen}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-red-400 mt-2">May contain traces. Always check the product label.</p>
                        </div>
                      )}

                      {!productInfo.nutrition && (!productInfo.allergens || productInfo.allergens.length === 0) && (
                        <p className="text-sm text-gray-500">No detailed nutrition or allergen information available for this product.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isMyItem && !item.isFree && !isSoldItem && (item as any)?.status !== 'refunded' && (item as any).status === 'available' && (
                <div className="border-t border-gray-100 mt-5 pt-5">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 md:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-0.5">Purchase This Item</h3>
                        <p className="text-xs text-gray-500">Secure payment via Stripe</p>
                      </div>
                      <p className="text-xl md:text-3xl font-bold text-green-600">${item.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 transition flex items-center justify-center space-x-2 font-semibold active:scale-[0.98]"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>Purchase Now</span>
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                      Your payment is secure. Pickup details provided after purchase.
                    </p>
                  </div>
                </div>
              )}

              {isBuyer && isSoldItem && (
                <div className="border-t border-gray-100 mt-5 pt-5">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4 md:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900">Pickup Issue?</h3>
                        <p className="text-xs text-gray-500">Request a refund if needed</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="w-full bg-orange-600 text-white py-3 px-6 rounded-xl hover:bg-orange-700 transition flex items-center justify-center space-x-2 font-semibold active:scale-[0.98]"
                    >
                      <RefreshCw className="h-5 w-5" />
                      <span>Request Refund</span>
                    </button>
                  </div>
                </div>
              )}

              {isMyItem && isSoldItem && (
                <div className="border-t border-gray-100 mt-5 pt-5">
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4 md:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <h3 className="text-sm md:text-lg font-semibold text-gray-900">Can't Provide This Item?</h3>
                        <p className="text-xs text-gray-500">Cancel the sale and refund the buyer</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="w-full bg-red-600 text-white py-3 px-6 rounded-xl hover:bg-red-700 transition flex items-center justify-center space-x-2 font-semibold active:scale-[0.98]"
                    >
                      <RefreshCw className="h-5 w-5" />
                      <span>Cancel & Refund Buyer</span>
                    </button>
                  </div>
                </div>
              )}

              {!isMyItem && (
                <div className="border-t border-gray-100 mt-5 pt-5">
                  <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-2">Contact Provider</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Have a question? Ask before starting a conversation:
                  </p>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question about this item (optional)..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3 text-sm bg-gray-50"
                    rows={3}
                  />
                  <button
                    onClick={handleContactProvider}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 transition flex items-center justify-center space-x-2 active:scale-[0.98]"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Start Conversation</span>
                  </button>
                  <p className="text-[10px] text-gray-400 mt-2 text-center">
                    Address revealed only after both parties agree
                  </p>
                </div>
              )}

              {isMyItem && (
                <div className="border-t border-gray-100 mt-5 pt-5">
                  <div className="bg-blue-50 p-4 rounded-xl text-center">
                    <p className="text-blue-700 text-sm font-medium">This is your item listing</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-5xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-10 right-0 md:top-4 md:right-4 text-white/70 hover:text-white text-3xl w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
            <img
              src={allImages[currentImageIndex]}
              alt={item.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-3 rounded-full active:bg-white/40 transition"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-3 rounded-full active:bg-white/40 transition"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
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
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl max-w-md w-full p-5 md:p-6 animate-slide-up md:animate-scale-in">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 md:hidden" />
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-orange-600" />
              {isBuyer ? 'Request Refund' : 'Cancel & Refund Buyer'}
            </h3>
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <p className="text-orange-900 font-semibold text-sm mb-1.5">Important</p>
              <ul className="list-disc list-inside text-orange-800 text-xs space-y-1">
                <li>Full refund will be processed immediately</li>
                <li>Item status will be marked as refunded</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason for refund:
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                rows={3}
                placeholder="Please explain why..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundReason('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl active:bg-gray-50 transition text-sm font-medium"
                disabled={refundLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl active:bg-orange-700 transition disabled:opacity-50 text-sm font-medium"
                disabled={refundLoading || !refundReason.trim()}
              >
                {refundLoading ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
