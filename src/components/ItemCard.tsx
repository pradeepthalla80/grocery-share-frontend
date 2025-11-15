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
    <div className={`rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
      item.isStoreItem ? 'bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200' : 'bg-white'
    }`}>
      <div className="relative w-full h-48 bg-gray-200">
        {allImages.length > 0 ? (
          <>
            <img
              src={allImages[currentImageIndex]}
              alt={`${item.name} - Image ${currentImageIndex + 1}`}
              className="w-full h-48 object-cover"
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition ${
                        idx === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Store Item Badge - Prominent for immediate differentiation */}
            {item.isStoreItem && (
              <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center space-x-1.5 shadow-xl border-2 border-white">
                <ShoppingCart className="h-4 w-4" />
                <span>🛒 MINI STORE</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
        
        {item.category && (
          <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
            <Tag className="h-4 w-4" />
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
              {item.category}
            </span>
          </div>
        )}

        <div className="space-y-2 text-sm text-gray-600">
          {/* Store Name - Prominent Display for Mini Stores */}
          {item.isStoreItem && item.user?.storeName && (
            <div className="bg-blue-100 border-l-4 border-blue-600 px-3 py-2 rounded flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-blue-700" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Mini Store</p>
                  <p className="text-sm font-bold text-blue-900">{item.user.storeName}</p>
                </div>
              </div>
              {item.user.averageRating !== undefined && item.user.ratingCount !== undefined && item.user.ratingCount > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-800">
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
            <div className="flex items-center space-x-2">
              {item.isFree ? (
                <span className="bg-green-100 text-green-700 font-semibold px-2 py-1 rounded text-sm">
                  🆓 FREE
                </span>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold text-green-600">${item.price.toFixed(2)}</span>
                </>
              )}
            </div>
            
            {/* Stock Info for Store Items */}
            {item.isStoreItem && item.quantity !== null && item.quantity !== undefined && (
              <div className="flex items-center space-x-1.5 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                <Package className="h-3 w-3" />
                <span>Stock: {item.quantity}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Expires: {format(new Date(item.expiryDate), 'MMM dd, yyyy')}</span>
          </div>

          {!item.flexiblePickup && item.pickupTimeStart && item.pickupTimeEnd && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="text-xs">
                Pickup: {format(new Date(item.pickupTimeStart), 'MMM dd, h:mm a')} - {format(new Date(item.pickupTimeEnd), 'h:mm a')}
              </span>
            </div>
          )}

          {item.flexiblePickup && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="text-xs text-gray-500">Flexible pickup time</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span className="text-xs">{item.location.address || `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}`}</span>
          </div>

          {item.user && !item.isStoreItem && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-gray-700">Seller: {item.user.name}</span>
              </div>
              {item.user.averageRating !== undefined && item.user.ratingCount !== undefined && item.user.ratingCount > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-800">
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
          <div className="mt-3 flex flex-wrap gap-1">
            {item.tags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {!isMyItem && !showActions && item.user && (
          <div className="mt-4 space-y-2">
            <button
              onClick={handleViewDetails}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              View Details
            </button>
            <button
              onClick={handleContactSeller}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Contact Seller
            </button>
          </div>
        )}

        {showActions && (
          <div className="mt-4 flex space-x-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
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
