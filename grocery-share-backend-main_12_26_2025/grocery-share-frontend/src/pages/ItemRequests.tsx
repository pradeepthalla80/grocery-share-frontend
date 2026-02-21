import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, MapPin, Package, MessageCircle, CheckCircle, X } from 'lucide-react';
import { getNearbyRequests, createItemRequest, respondToRequest, type ItemRequest } from '../api/itemRequests';
import { useToast } from '../hooks/useToast';
import { AddressInput } from '../components/AddressInput';
import { useNavigate } from 'react-router-dom';

const requestSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  category: z.string().min(1, 'Category is required'),
  notes: z.string().optional(),
  validityPeriod: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

export const ItemRequests = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
          fetchRequests(lat, lng);
        },
        () => {
          setLocation({ lat: 40.7128, lng: -74.0060 });
          fetchRequests(40.7128, -74.0060);
        }
      );
    }
  }, []);

  const fetchRequests = async (lat: number, lng: number) => {
    try {
      const response = await getNearbyRequests(lat, lng, 10);
      setRequests(response.requests || []);
    } catch (error) {
      showToast('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RequestFormData) => {
    if (!location) {
      showToast('Please allow location access', 'error');
      return;
    }

    try {
      await createItemRequest({
        ...data,
        location: {
          coordinates: [location.lng, location.lat]
        },
        address,
        approximateLocation: address.split(',').slice(-2).join(',').trim(),
        validityPeriod: data.validityPeriod || 'never'
      });
      showToast('Item request created successfully!', 'success');
      reset();
      setShowCreateForm(false);
      if (location) {
        fetchRequests(location.lat, location.lng);
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to create request', 'error');
    }
  };

  const handleRespond = async (requestId: string, requesterId: string, itemName: string) => {
    try {
      await respondToRequest(requestId, 'I can help with this!');
      showToast('Response sent! Redirecting to chat...', 'success');
      setTimeout(() => {
        navigate(`/chat?receiverId=${requesterId}&message=${encodeURIComponent(`Hi! I can help with your request for "${itemName}".`)}`);
      }, 1000);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to respond', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-5 md:py-8">
        <div className="flex justify-between items-start mb-5 md:mb-8">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Item Requests</h1>
            <p className="text-gray-500 mt-0.5 text-xs md:text-base">Help others by fulfilling their requests</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3.5 py-2 rounded-xl text-sm font-medium active:scale-[0.97] transition"
          >
            {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span className="hidden md:inline">{showCreateForm ? 'Cancel' : 'Post Request'}</span>
            <span className="md:hidden">{showCreateForm ? 'Close' : 'Post'}</span>
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-2xl md:rounded-xl shadow-sm border border-gray-100 p-5 md:p-6 mb-5 md:mb-8 animate-slide-up">
            <h2 className="text-base md:text-xl font-semibold text-gray-900 mb-4">Create Request</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  {...register('itemName')}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
                  placeholder="e.g., 2 gallons of milk"
                />
                {errors.itemName && <p className="text-xs text-red-600 mt-1">{errors.itemName.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    {...register('quantity')}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
                    placeholder="e.g., 2 items"
                  />
                  {errors.quantity && <p className="text-xs text-red-600 mt-1">{errors.quantity.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    {...register('category')}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
                  >
                    <option value="">Select category</option>
                    <option value="produce">Produce</option>
                    <option value="dairy">Dairy</option>
                    <option value="meat">Meat</option>
                    <option value="bakery">Bakery</option>
                    <option value="pantry">Pantry</option>
                    <option value="frozen">Frozen</option>
                    <option value="beverages">Beverages</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>}
                </div>
              </div>

              <AddressInput
                onLocationSelect={(loc) => {
                  setAddress(loc.address);
                  setLocation({ lat: loc.lat, lng: loc.lng });
                }}
                defaultAddress={address}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Validity Period</label>
                <select
                  {...register('validityPeriod')}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
                >
                  <option value="never">Never expires</option>
                  <option value="2h">2 hours</option>
                  <option value="6h">6 hours</option>
                  <option value="12h">12 hours</option>
                  <option value="24h">24 hours</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">After this period, your request will be hidden</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
                  placeholder="Any specific requirements..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition font-medium active:scale-[0.98]"
              >
                Post Request
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-56 skeleton rounded-2xl" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <Package className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No requests nearby</h3>
            <p className="text-gray-400 text-sm">Be the first to post a request in your area!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {requests.map((request) => (
              <div key={request._id} className="bg-white rounded-2xl md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 mobile-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm md:text-lg font-semibold text-gray-900 line-clamp-1">{request.itemName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{request.quantity}</p>
                  </div>
                  <span className="ml-2 px-2.5 py-1 bg-green-50 text-green-700 text-[10px] md:text-xs font-medium rounded-lg flex-shrink-0">
                    {request.category}
                  </span>
                </div>

                {request.notes && (
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">{request.notes}</p>
                )}

                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="line-clamp-1">{request.approximateLocation || 'Nearby'}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                  <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] font-bold text-green-700">{request.user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="font-medium text-gray-600">{request.user.name}</span>
                </div>

                {request.responses.length > 0 && (
                  <div className="mb-3 p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs text-blue-700 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {request.responses.length} {request.responses.length === 1 ? 'person' : 'people'} responded
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/request/${request._id}`)}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-xs font-medium active:scale-[0.97] transition"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => handleRespond(request._id, request.user.id, request.itemName)}
                    className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-medium active:scale-[0.97] transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Help
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
