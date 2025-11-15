import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, MapPin, Package, MessageCircle, CheckCircle, X } from 'lucide-react';
import { getNearbyRequests, createItemRequest, respondToRequest, updateRequest, getRequestById, type ItemRequest } from '../api/itemRequests';
import { useToast } from '../hooks/useToast';
import { AddressInput } from '../components/AddressInput';
import { useNavigate, useSearchParams } from 'react-router-dom';

const requestSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  category: z.string().min(1, 'Category is required'),
  notes: z.string().optional(),
  validityPeriod: z.string().optional(),
  pricePreference: z.enum(['free_only', 'willing_to_pay']),
  maxPrice: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

export const ItemRequests = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [editingRequest, setEditingRequest] = useState<ItemRequest | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      pricePreference: 'free_only'
    }
  });

  const watchPricePreference = watch('pricePreference');

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
          showToast('Could not get your location. Please enter it manually.', 'error');
          setShowLocationPicker(true);
          setLoading(false);
        }
      );
    } else {
      showToast('Location services not available. Please enter your location.', 'error');
      setShowLocationPicker(true);
      setLoading(false);
    }
  }, []);

  // Handle edit mode
  useEffect(() => {
    if (editId) {
      const fetchRequestToEdit = async () => {
        try {
          const request = await getRequestById(editId);
          setEditingRequest(request);
          setShowCreateForm(true);
          
          // Populate form fields
          setValue('itemName', request.itemName);
          setValue('quantity', request.quantity);
          setValue('category', request.category);
          setValue('notes', request.notes || '');
          setValue('pricePreference', request.pricePreference || 'free_only');
          setValue('maxPrice', request.maxPrice?.toString() || '');
          
          // Set location and address
          if (request.location) {
            setLocation({
              lat: request.location.coordinates[1],
              lng: request.location.coordinates[0]
            });
          }
          if (request.address) {
            setAddress(request.address);
          }
        } catch (error) {
          showToast('Failed to load request for editing', 'error');
          setSearchParams({});
        }
      };
      
      fetchRequestToEdit();
    } else {
      setEditingRequest(null);
    }
  }, [editId, setValue, showToast, setSearchParams]);

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
      const requestData = {
        ...data,
        location: {
          coordinates: [location.lng, location.lat]
        },
        address,
        approximateLocation: address.split(',').slice(-2).join(',').trim(),
        validityPeriod: data.validityPeriod || 'never'
      };

      if (editingRequest) {
        // Update existing request
        await updateRequest(editingRequest._id, requestData);
        showToast('Request updated successfully!', 'success');
        setSearchParams({});
      } else {
        // Create new request
        await createItemRequest(requestData);
        showToast('Item request created successfully!', 'success');
      }
      
      reset();
      setShowCreateForm(false);
      setEditingRequest(null);
      if (location) {
        fetchRequests(location.lat, location.lng);
      }
    } catch (error: any) {
      const action = editingRequest ? 'update' : 'create';
      showToast(error.response?.data?.error || `Failed to ${action} request`, 'error');
    }
  };

  const handleRespond = async (requestId: string, requesterId: string) => {
    try {
      // First, send the initial response
      await respondToRequest(requestId, 'I can help with this!');
      showToast('Response sent! Opening chat...', 'success');
      
      // Wait a moment for the backend to create the conversation
      // Then navigate with the receiverId so Chat page can fetch and display it
      setTimeout(() => {
        navigate(`/chat?receiverId=${requesterId}&requestId=${requestId}`);
      }, 800);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to respond', 'error');
    }
  };

  const handleSearchLocationSelect = (loc: { address: string; lat: number; lng: number }) => {
    setSearchAddress(loc.address);
    setLocation({ lat: loc.lat, lng: loc.lng });
    setShowLocationPicker(false);
    fetchRequests(loc.lat, loc.lng);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Item Requests</h1>
            <p className="text-gray-600 mt-2">Help others by fulfilling their grocery requests</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
            {showCreateForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {showCreateForm ? 'Cancel' : 'Post Request'}
          </button>
        </div>

        {showLocationPicker && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">
              📍 Set Your Location to See Nearby Requests
            </h3>
            <p className="text-sm text-yellow-800 mb-4">
              Enter your address to find item requests in your area
            </p>
            <AddressInput
              onLocationSelect={handleSearchLocationSelect}
              defaultAddress={searchAddress}
            />
          </div>
        )}

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingRequest ? 'Edit Item Request' : 'Create Item Request'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  {...register('itemName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 2 gallons of milk"
                />
                {errors.itemName && <p className="text-sm text-red-600 mt-1">{errors.itemName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  {...register('quantity')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 2 items or 1 lb"
                />
                {errors.quantity && <p className="text-sm text-red-600 mt-1">{errors.quantity.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>}
              </div>

              <AddressInput
                onLocationSelect={(loc) => {
                  setAddress(loc.address);
                  setLocation({ lat: loc.lat, lng: loc.lng });
                }}
                defaultAddress={address}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Preference</label>
                <select
                  {...register('pricePreference')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="free_only">Free Only - Looking for donations</option>
                  <option value="willing_to_pay">Willing to Pay - Set max price</option>
                </select>
                {errors.pricePreference && <p className="text-sm text-red-600 mt-1">{errors.pricePreference.message}</p>}
              </div>

              {watchPricePreference === 'willing_to_pay' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Price You'll Pay</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register('maxPrice')}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Providers can offer for free or any amount up to this price</p>
                  {errors.maxPrice && <p className="text-sm text-red-600 mt-1">{errors.maxPrice.message}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Validity Period</label>
                <select
                  {...register('validityPeriod')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="never">Never expires</option>
                  <option value="2h">2 hours</option>
                  <option value="6h">6 hours</option>
                  <option value="12h">12 hours</option>
                  <option value="24h">24 hours</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">After this period, your request will be automatically hidden</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Any specific requirements or preferences..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
              >
                {editingRequest ? 'Update Request' : 'Post Request'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests nearby</h3>
            <p className="text-gray-600">Be the first to post a request in your area!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <div key={request._id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{request.itemName}</h3>
                    <p className="text-sm text-gray-600">{request.quantity}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {request.category}
                  </span>
                </div>

                {request.notes && (
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">{request.notes}</p>
                )}

                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  {request.approximateLocation || 'Nearby'}
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  Requested by <span className="font-medium">{request.user.name}</span>
                </div>

                {request.responses.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      {request.responses.length} {request.responses.length === 1 ? 'person has' : 'people have'} responded
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/request/${request._id}`)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleRespond(request._id, request.user.id)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Offer to Help
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
