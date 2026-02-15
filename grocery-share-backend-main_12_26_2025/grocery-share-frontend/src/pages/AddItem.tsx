import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { itemsAPI } from '../api/items';
import { FormInput } from '../components/FormInput';
import { ImageUpload } from '../components/ImageUpload';
import { AddressInput } from '../components/AddressInput';
import { LocationMap } from '../components/LocationMap';
import { ArrowLeft } from 'lucide-react';

const addItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().optional(),
  tags: z.string().optional(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  price: z.string().optional(),
  isFree: z.boolean().optional(),
  pickupTimeStart: z.string().optional(),
  pickupTimeEnd: z.string().optional(),
  flexiblePickup: z.boolean().optional(),
  validityPeriod: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  lat: z.number(),
  lng: z.number(),
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageError, setImageError] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [flexiblePickup, setFlexiblePickup] = useState(true);
  const [locationError, setLocationError] = useState('');

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
    },
  });

  const lat = watch('lat');
  const lng = watch('lng');
  const address = watch('address');

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

      if (data.validityPeriod) {
        formData.append('validityPeriod', data.validityPeriod);
      }

      imageFiles.forEach(file => {
        formData.append('images', file);
      });

            const response = await itemsAPI.create(formData);
      
      console.log('Item created successfully:', response);
      alert('Item added successfully!');
      navigate('/dashboard');
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
      <div className="max-w-3xl mx-auto px-4 py-5 md:py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-500 active:text-gray-700 mb-4 md:mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-2xl md:rounded-xl shadow-sm border border-gray-100 p-5 md:p-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-5 md:mb-6">Add New Item</h1>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 md:space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <FormInput
                label="Category (Optional)"
                type="text"
                {...register('category')}
                error={errors.category?.message}
                placeholder="e.g., Fruits"
              />

              <FormInput
                label="Tags (comma-separated)"
                type="text"
                {...register('tags')}
                error={errors.tags?.message}
                placeholder="e.g., organic, fresh"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <FormInput
                label="Expiry Date"
                type="date"
                {...register('expiryDate')}
                error={errors.expiryDate?.message}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Listing Validity
                </label>
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
                <p className="text-[10px] text-gray-400">After this period, your listing will be hidden</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className={`w-10 h-6 rounded-full relative transition-colors ${isFree ? 'bg-green-600' : 'bg-gray-300'}`}
                  onClick={() => { setIsFree(!isFree); setValue('isFree', !isFree); }}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isFree ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Give away for free</span>
              </label>
              <input type="hidden" {...register('isFree')} />

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

            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className={`w-10 h-6 rounded-full relative transition-colors ${flexiblePickup ? 'bg-green-600' : 'bg-gray-300'}`}
                  onClick={() => { setFlexiblePickup(!flexiblePickup); setValue('flexiblePickup', !flexiblePickup); }}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${flexiblePickup ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Flexible Pickup Time</span>
              </label>
              <input type="hidden" {...register('flexiblePickup')} />

              {!flexiblePickup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Pickup Start"
                    type="datetime-local"
                    {...register('pickupTimeStart')}
                    error={errors.pickupTimeStart?.message}
                  />
                  <FormInput
                    label="Pickup End"
                    type="datetime-local"
                    {...register('pickupTimeEnd')}
                    error={errors.pickupTimeEnd?.message}
                  />
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
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Map Preview
                </label>
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <LocationMap
                    lat={lat}
                    lng={lng}
                    address={address}
                    height="250px"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium active:scale-[0.98]"
              >
                {loading ? 'Adding...' : 'Add Item'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 active:bg-gray-50 transition font-medium"
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
