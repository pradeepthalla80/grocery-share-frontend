import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Item } from '../api/items';
import { Calendar, MapPin, ChevronLeft, ChevronRight, Clock, MessageCircle, Package, Store } from 'lucide-react';
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

  const timeUntilExpiry = new Date(item.expiryDate).getTime() - new Date().getTime();
  const daysLeft = Math.max(0, Math.floor(timeUntilExpiry / (1000 * 60 * 60 * 24)));
  const isExpiringSoon = daysLeft <= 2 && daysLeft > 0;
  const isExpired = timeUntilExpiry <= 0;

  const handleViewDetails = () => {
    navigate(`/item/${item.id}`);
  };

  const handleContactSeller = () => {
    if (item.user?.id) {
      navigate(`/chat?receiverId=${item.user.id}&itemId=${item.id}`);
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="bg-white rounded-2xl md:rounded-xl shadow-sm border border-gray-100 overflow-hidden mobile-card">
      <div className="relative w-full h-44 md:h-48 bg-gray-100 cursor-pointer" onClick={handleViewDetails}>
        {allImages.length > 0 ? (
          <>
            <img
              src={allImages[currentImageIndex]}
              alt={`${item.name} - Image ${currentImageIndex + 1}`}
              className="w-full h-44 md:h-48 object-cover"
              loading="lazy"
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full active:bg-black/60 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full active:bg-black/60 transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                      className={`w-1.5 h-1.5 rounded-full transition ${
                        idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <Package className="h-12 w-12" />
          </div>
        )}

        {item.isFree ? (
          <div className="absolute top-2.5 left-2.5 bg-green-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
            FREE
          </div>
        ) : (
          <div className="absolute top-2.5 left-2.5 bg-white/95 text-green-700 px-2.5 py-1 rounded-lg text-sm font-bold shadow-sm">
            ${item.price.toFixed(2)}
          </div>
        )}

        {isExpired && (
          <div className="absolute top-2.5 right-2.5 bg-red-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
            EXPIRED
          </div>
        )}
        {isExpiringSoon && !isExpired && (
          <div className="absolute top-2.5 right-2.5 bg-amber-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
            {daysLeft}d LEFT
          </div>
        )}

        {item.isStoreItem && (
          <div className="absolute bottom-2 left-2 bg-purple-600/90 text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-0.5">
            <Store className="h-3 w-3" />
            Store Item
          </div>
        )}

        {item.category && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-0.5 rounded-md text-[10px]">
            {item.category}
          </div>
        )}
      </div>

      <div className="p-3.5 md:p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
        </div>
        
        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{format(new Date(item.expiryDate), 'MMM dd, yyyy')}</span>
          </div>

          {item.flexiblePickup && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Flexible pickup</span>
            </div>
          )}

          {!item.flexiblePickup && item.pickupTimeStart && item.pickupTimeEnd && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="line-clamp-1">{format(new Date(item.pickupTimeStart), 'MMM dd, h:mm a')}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{item.location.address ? item.location.address.split(',')[0] : `${item.location.lat.toFixed(3)}, ${item.location.lng.toFixed(3)}`}</span>
          </div>

          {item.user && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] font-bold text-green-700">{item.user.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="font-medium">{item.user.name}</span>
            </div>
          )}
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px]"
              >
                #{tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-gray-400 text-[10px] self-center">+{item.tags.length - 3}</span>
            )}
          </div>
        )}

        {!isMyItem && !showActions && item.user && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleViewDetails}
              className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-xs font-medium active:scale-[0.97] transition"
            >
              Details
            </button>
            <button
              onClick={handleContactSeller}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-medium active:scale-[0.97] transition flex items-center justify-center gap-1"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Message
            </button>
          </div>
        )}

        {showActions && (
          <div className="mt-3 flex gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-xl text-xs font-medium active:scale-[0.97] transition"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded-xl text-xs font-medium active:scale-[0.97] transition"
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
