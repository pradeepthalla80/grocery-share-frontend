import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { itemsAPI } from '../api/items';
import { FormInput } from '../components/FormInput';
import { ImageUpload } from '../components/ImageUpload';
import { AddressInput } from '../components/AddressInput';
import { LocationMap } from '../components/LocationMap';
import { ArrowLeft, Store } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const addItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().optional(),
  customCategory: z.string().optional(),
  tags: z.string().optional(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  price: z.string().optional(),
  isFree: z.boolean().optional(),
  quantity: z.string().optional(),
  stockStatus: z.string().optional(),
  pickupTimeStart: z.string().optional(),
  pickupTimeEnd: z.string().optional(),
  flexiblePickup: z.boolean().optional(),
  validityPeriod: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  lat: z.number(),
  lng: z.number(),
  offerDelivery: z.boolean().optional(),
  deliveryFee: z.string().optional(),
}).refine((data) => {
  if (data.offerDelivery && data.deliveryFee && data.deliveryFee !== 'free') {
    const fee = Number(data.deliveryFee);
    if (isNaN(fee) || fee < 1 || fee > 5) {
      return false;
    }
  }
  return true;
}, {
  message: 'Delivery fee must be free or between $1-$5',
  path: ['deliveryFee'],
}).refine((data) => {
  if (!data.isFree && (!data.price || Number(data.price) <= 0)) {
    return false;
  }
  return true;
}, {
  message: 'Price must be a positive number when item is not free',
  path: ['price'],
}).refine((data) => {
  if (!data.flexiblePickup && data.pickupTimeStart && data.pickupTimeEnd) {
    return new Date(data.pickupTimeEnd) > new Date(data.pickupTimeStart);
  }
  return true;
}, {
  message: 'Pickup end time must be after start time',
  path: ['pickupTimeEnd'],
});

type AddItemFormData = z.infer<typeof addItemSchema>;

export const AddItem = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageError, setImageError] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [flexiblePickup, setFlexiblePickup] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [offerDelivery, setOfferDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('free');
  const [isStoreItem, setIsStoreItem] = useState(false);
  const [stockStatus, setStockStatus] = useState('in_stock');
  const [selectedCategory, setSelectedCategory] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddItemFormData>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      address: '',
      lat: 41.881832,
      lng: -87.623177,
      isFree: false,
      flexiblePickup: true,
      offerDelivery: false,
      deliveryFee: 'free',
      quantity: '1',
      stockStatus: 'in_stock',
    },
  });

  const lat = watch('lat');
  const lng = watch('lng');
  const address = watch('address');

  useEffect(() => {
    const isStoreItemParam = searchParams.get('isStoreItem') === 'true';
    if (isStoreItemParam && user?.storeMode) {
      setIsStoreItem(true);
    }
  }, [searchParams, user]);

  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setValue('address', location.address);
    setValue('lat', location.lat);
    setValue('lng', location.lng);
    setLocationError('');
  };

  const handleImageChange = (files: File[]) => {
    setImageFiles(files);
    if (files.length === 0) {
      setImageError('Please provide at least one image');
    } else {
      setImageError('');
    }
  };

  const onSubmit = async (data: AddItemFormData) => {
    try {
      setLoading(true);
      setError('');
      setImageError('');

      if (imageFiles.length === 0) {
        setImageError('Please upload at least one image');
        setLoading(false);
        return;
      }

      if (!data.address || data.lat === undefined || data.lat === null || data.lng === undefined || data.lng === null) {
        setLocationError('Please select a location');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('name', data.name);
      if (data.category) {
        formData.append('category', data.category);
      }
      if (data.customCategory && selectedCategory === 'Other') {
        formData.append('customCategory', data.customCategory);
      }
      formData.append('expiryDate', data.expiryDate);
      formData.append('isFree', isFree.toString());
      formData.append('price', isFree ? '0' : (data.price || '0'));
      formData.append('flexiblePickup', flexiblePickup.toString());
      if (!flexiblePickup && data.pickupTimeStart) {
        formData.append('pickupTimeStart', data.pickupTimeStart);
      }
      if (!flexiblePickup && data.pickupTimeEnd) {
        formData.append('pickupTimeEnd', data.pickupTimeEnd);
      }
      
      const tags = data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      formData.append('tags', JSON.stringify(tags));
      
      formData.append('address', data.address);
      formData.append('location', JSON.stringify({
        lat: data.lat,
        lng: data.lng,
      }));

      // Add validity period
      if (data.validityPeriod) {
        formData.append('validityPeriod', data.validityPeriod);
      }

      // Add delivery options
      formData.append('offerDelivery', offerDelivery.toString());
      if (offerDelivery) {
        formData.append('deliveryFee', deliveryFee === 'free' ? '0' : deliveryFee);
      }

      // Add store item fields
      if (isStoreItem) {
        formData.append('isStoreItem', 'true');
        formData.append('quantity', data.quantity || '1');
        formData.append('stockStatus', stockStatus);
      }

      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await itemsAPI.create(formData);
      
      console.log('Item created successfully:', response);
      alert(isStoreItem ? 'Store item added successfully!' : 'Item added successfully!');
      navigate(isStoreItem ? '/store-dashboard' : '/dashboard');
    } catch (err: any) {
      console.error('Create item error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to add item';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
          <div className="flex items-center space-x-3 mb-6">
            {isStoreItem && (
              <div className="bg-blue-100 p-2 rounded-lg">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isStoreItem ? 'Add Store Item' : 'Add New Item'}
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormInput
              label="Item Name"
              type="text"
              {...register('name')}
              error={errors.name?.message}
              placeholder="e.g., Organic Apples"
            />

            <ImageUpload
              maxImages={5}
              onChange={handleImageChange}
              error={imageError}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Category (Optional)
                </label>
                <select
                  {...register('category')}
                  value={selectedCategory}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCategory(value);
                    setValue('category', value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a category</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Meat">Meat</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Pantry">Pantry</option>
                  <option value="Oils & Spices">Oils & Spices</option>
                  <option value="Condiments & Sauces">Condiments & Sauces</option>
                  <option value="Frozen Foods">Frozen Foods</option>
                  <option value="Canned Goods">Canned Goods</option>
                  <option value="Grains & Pasta">Grains & Pasta</option>
                  <option value="Seafood">Seafood</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Baby Food">Baby Food</option>
                  <option value="Pet Food">Pet Food</option>
                  <option value="Other">Other (Specify Below)</option>
                </select>
                {errors.category && (
                  <p className="text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <FormInput
                label="Tags (comma-separated, optional)"
                type="text"
                {...register('tags')}
                error={errors.tags?.message}
                placeholder="e.g., organic, fresh, local"
              />
            </div>

            {selectedCategory === 'Other' && (
              <FormInput
                label="Custom Category"
                type="text"
                {...register('customCategory')}
                error={errors.customCategory?.message}
                placeholder="e.g., Cooking Oil, Spices, etc."
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Expiry Date"
                type="date"
                {...register('expiryDate')}
                error={errors.expiryDate?.message}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Listing Validity Period
                </label>
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
                <p className="text-xs text-gray-500">After this period, your listing will be automatically hidden</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                {!isStoreItem && (
                  <label className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      {...register('isFree')}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsFree(checked);
                        setValue('isFree', checked);
                      }}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Give away for free</span>
                  </label>
                )}

                {!isFree && (
                  <FormInput
                    label="Price ($)"
                    type="number"
                    step="0.01"
                    {...register('price')}
                    error={errors.price?.message}
                    placeholder="9.99"
                  />
                )}
              </div>

              {isStoreItem && (
                <FormInput
                  label="Quantity in Stock"
                  type="number"
                  min="0"
                  {...register('quantity')}
                  error={errors.quantity?.message}
                  placeholder="100"
                />
              )}
            </div>

            {isStoreItem && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Stock Status
                </label>
                <select
                  {...register('stockStatus')}
                  value={stockStatus}
                  onChange={(e) => {
                    setStockStatus(e.target.value);
                    setValue('stockStatus', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="in_stock">✅ In Stock</option>
                  <option value="low_stock">⚠️ Low Stock</option>
                  <option value="out_of_stock">❌ Out of Stock</option>
                  <option value="unlimited">♾️ Unlimited Stock</option>
                </select>
                <p className="text-xs text-gray-500">
                  Customers will see this status when viewing your item
                </p>
              </div>
            )}

            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('flexiblePickup')}
                  checked={flexiblePickup}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFlexiblePickup(checked);
                    setValue('flexiblePickup', checked);
                  }}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Flexible Pickup Time</span>
              </label>

              {!flexiblePickup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="Pickup Start Time"
                    type="datetime-local"
                    {...register('pickupTimeStart')}
                    error={errors.pickupTimeStart?.message}
                  />
                  <FormInput
                    label="Pickup End Time"
                    type="datetime-local"
                    {...register('pickupTimeEnd')}
                    error={errors.pickupTimeEnd?.message}
                  />
                </div>
              )}
            </div>

            <div className="border-t pt-6 space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('offerDelivery')}
                  checked={offerDelivery}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setOfferDelivery(checked);
                    setValue('offerDelivery', checked);
                  }}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Offer Delivery/Drop-off</span>
              </label>

              {offerDelivery && (
                <div className="ml-6 space-y-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Fee
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value="free"
                        checked={deliveryFee === 'free'}
                        onChange={(e) => {
                          setDeliveryFee(e.target.value);
                          setValue('deliveryFee', e.target.value);
                        }}
                        className="h-4 w-4 text-green-600"
                      />
                      <span className="text-sm text-gray-700">🚚 Free Delivery</span>
                    </label>
                    {['1', '2', '3', '4', '5'].map((fee) => (
                      <label key={fee} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value={fee}
                          checked={deliveryFee === fee}
                          onChange={(e) => {
                            setDeliveryFee(e.target.value);
                            setValue('deliveryFee', e.target.value);
                          }}
                          className="h-4 w-4 text-green-600"
                        />
                        <span className="text-sm text-gray-700">${fee} Delivery Fee</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <AddressInput
              onLocationSelect={handleLocationSelect}
              defaultAddress={address}
              defaultLat={lat}
              defaultLng={lng}
              error={locationError || errors.address?.message}
            />

            {lat !== undefined && lat !== null && lng !== undefined && lng !== null && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Map Preview
                </label>
                <LocationMap
                  lat={lat}
                  lng={lng}
                  address={address}
                  height="300px"
                />
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Adding Item...' : 'Add Item'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
