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
  imageURL: z.string().url('Must be a valid URL').optional().or(z.literal('')),
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

      if (imageFiles.length === 0 && !data.imageURL) {
        setImageError('Please provide at least one image');
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
      if (data.imageURL) {
        formData.append('imageURL', data.imageURL);
      }
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

      // Calculate expiration date if validity period is set
      if (data.validityPeriod && data.validityPeriod !== 'never') {
        const now = new Date();
        let expiresAt;
        
        switch (data.validityPeriod) {
          case '2h':
            expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
            break;
          case '6h':
            expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
            break;
          case '12h':
            expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
            break;
          case '24h':
            expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
        }
        
        if (expiresAt) {
          formData.append('expiresAt', expiresAt.toISOString());
        }
      }

      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      await itemsAPI.create(formData);

      alert('Item added successfully!');
      navigate('/my-items');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add item');
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

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Item</h1>

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

            <FormInput
              label="Image URL (Optional - only if not uploading files)"
              type="url"
              {...register('imageURL')}
              error={errors.imageURL?.message}
              placeholder="https://example.com/image.jpg"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Category (Optional)"
                type="text"
                {...register('category')}
                error={errors.category?.message}
                placeholder="e.g., Fruits"
              />

              <FormInput
                label="Tags (comma-separated, optional)"
                type="text"
                {...register('tags')}
                error={errors.tags?.message}
                placeholder="e.g., organic, fresh, local"
              />
            </div>

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
            </div>

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
