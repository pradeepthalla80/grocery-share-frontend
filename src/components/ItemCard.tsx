import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Item } from '../api/items';
import { Calendar, DollarSign, MapPin, Tag, User, ChevronLeft, ChevronRight, Clock, MessageCircle, ShoppingCart, Package, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

interface ItemCardProps {
  item: Item;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onEdit, onDelete, showActions = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const allImages = item.images && item.images.length > 0 
    ? item.images 
    : item.imageURL 
    ? [item.imageURL] 
    : [];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isMyItem = item.user?.id === user?.id;

  const handleViewDetails = () => {
    navigate(`/item/${item.id}`);
  };

  const handleContactSeller = () => {
    if (item.user?.id) {
      navigate(`/chat?receiverId=${item.user.id}&itemId=${item.id}`);
    }
  };

  const nextImage = () => {
    if (allImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    if (allImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className={`rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex gap-2 p-2 ${
      item.isStoreItem ? 'bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200' : 'bg-white'
    }`}>
      {/* Compact Square Thumbnail on Left */}
      <div className="relative w-20 min-w-[80px] aspect-square bg-gray-100 rounded overflow-hidden">
        {allImages.length > 0 ? (
          <>
            <img
              src={allImages[currentImageIndex]}
              alt={`${item.name} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-contain"
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-0.5 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-0.5 rounded-full hover:bg-opacity-70 transition"
                >
                  <ChevronLeft className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-0.5 rounded-full hover:bg-opacity-70 transition"
                >
                  <ChevronRight className="h-2.5 w-2.5" />
                </button>
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex space-x-0.5">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-1 h-1 rounded-full transition ${
                        idx === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Store Item Badge */}
            {item.isStoreItem && (
              <div className="absolute top-0.5 left-0.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-1 py-0.5 rounded text-xs font-bold flex items-center space-x-0.5 shadow-xl border border-white">
                <ShoppingCart className="h-2.5 w-2.5" />
                <span>🛒</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-xs">
            No Image
          </div>
        )}
      </div>

      {/* Content on Right */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 mb-0.5 truncate">{item.name}</h3>
        
        {item.category && (
          <div className="flex items-center space-x-1 mb-0.5">
            <Tag className="h-3 w-3 text-gray-600" />
            <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full text-xs">
              {item.category}
            </span>
          </div>
        )}

        <div className="space-y-0.5 text-sm text-gray-600">
          {/* Store Name - Prominent Display for Mini Stores */}
          {item.isStoreItem && item.user?.storeName && (
            <div className="bg-blue-100 border-l-2 border-blue-600 px-1.5 py-0.5 rounded flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <ShoppingCart className="h-3 w-3 text-blue-700" />
                <p className="text-xs font-bold text-blue-900">{item.user.storeName}</p>
              </div>
              {item.user.averageRating !== undefined && item.user.ratingCount !== undefined && item.user.ratingCount > 0 && (
                <div className="flex items-center space-x-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-semibold text-gray-800">
                    {item.user.averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-600">
                    ({item.user.ratingCount})
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {item.isFree ? (
                <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded text-xs">
                  🆓 FREE
                </span>
              ) : (
                <>
                  <DollarSign className="h-3 w-3" />
                  <span className="font-semibold text-green-600 text-xs">${item.price.toFixed(2)}</span>
                </>
              )}
            </div>
            
            {/* Stock Info for Store Items */}
            {item.isStoreItem && item.quantity !== null && item.quantity !== undefined && (
              <div className="flex items-center space-x-0.5 bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
                <Package className="h-3 w-3" />
                <span>Stock: {item.quantity}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span className="text-xs">Expires: {format(new Date(item.expiryDate), 'MMM dd')}</span>
          </div>

          {!item.flexiblePickup && item.pickupTimeStart && item.pickupTimeEnd && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span className="text-xs truncate">
                Pickup: {format(new Date(item.pickupTimeStart), 'MMM dd, h:mm a')} - {format(new Date(item.pickupTimeEnd), 'h:mm a')}
              </span>
            </div>
          )}

          {item.flexiblePickup && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span className="text-xs text-gray-500">Flexible pickup</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span className="text-xs truncate">
              {item.distance !== undefined ? `${item.distance.toFixed(1)} mi away` : 'Location available'}
            </span>
          </div>

          {item.user && !item.isStoreItem && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span className="text-gray-700 text-xs">Seller: {item.user.name}</span>
              </div>
              {item.user.averageRating !== undefined && item.user.ratingCount !== undefined && item.user.ratingCount > 0 && (
                <div className="flex items-center space-x-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-semibold text-gray-800">
                    {item.user.averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-600">
                    ({item.user.ratingCount})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-0.5">
            {item.tags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-gray-200 text-gray-700 px-1 py-0.5 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {!isMyItem && !showActions && item.user && (
          <div className="mt-1 space-y-0.5">
            <button
              onClick={handleViewDetails}
              className="w-full bg-blue-600 text-white px-2 py-1.5 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-1 text-xs min-h-[36px]"
            >
              View Details
            </button>
            <button
              onClick={handleContactSeller}
              className="w-full bg-green-600 text-white px-2 py-1.5 rounded-md hover:bg-green-700 transition flex items-center justify-center gap-1 text-xs min-h-[36px]"
            >
              <MessageCircle className="h-3 w-3" />
              Contact Seller
            </button>
          </div>
        )}

        {showActions && (
          <div className="mt-1 flex space-x-1">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 bg-blue-600 text-white px-2 py-1.5 rounded-md hover:bg-blue-700 transition text-xs min-h-[36px]"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex-1 bg-red-600 text-white px-2 py-1.5 rounded-md hover:bg-red-700 transition text-xs min-h-[36px]"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
