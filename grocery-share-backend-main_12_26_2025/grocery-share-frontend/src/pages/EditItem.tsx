import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { itemsAPI, type Item } from '../api/items';
import { FormInput } from '../components/FormInput';
import { ImageUpload } from '../components/ImageUpload';
import { AddressInput } from '../components/AddressInput';
import { LocationMap } from '../components/LocationMap';
import { ArrowLeft } from 'lucide-react';

const editItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().optional(),
  tags: z.string().optional(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  price: z.string().optional(),
  isFree: z.boolean().optional(),
  pickupTimeStart: z.string().optional(),
  pickupTimeEnd: z.string().optional(),
  flexiblePickup: z.boolean().optional(),
  lat: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num >= -90 && num <= 90;
  }, { message: 'Latitude must be between -90 and 90' }),
  lng: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num >= -180 && num <= 180;
  }, { message: 'Longitude must be between -180 and 180' }),
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

type EditItemFormData = z.infer<typeof editItemSchema>;

export const EditItem = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [deletedImagePublicIds, setDeletedImagePublicIds] = useState<string[]>([]);
  const [isFree, setIsFree] = useState(false);
  const [flexiblePickup, setFlexiblePickup] = useState(true);
  const [currentLat, setCurrentLat] = useState(0);
  const [currentLng, setCurrentLng] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditItemFormData>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      isFree: false,
      flexiblePickup: true,
    },
  });

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await itemsAPI.getMyItems();
        const item = response.items.find((item: Item) => item.id === id);
        
        if (item) {
          setValue('name', item.name);
          setValue('category', item.category || '');
          setValue('tags', item.tags.join(', '));
          setValue('expiryDate', item.expiryDate.split('T')[0]);
          setValue('price', item.price.toString());
          setValue('lat', item.location.lat.toString());
          setValue('lng', item.location.lng.toString());
          setCurrentLat(item.location.lat);
          setCurrentLng(item.location.lng);
          const itemIsFree = item.isFree || false;
          setIsFree(itemIsFree);
          setValue('isFree', itemIsFree);
          const itemFlexiblePickup = item.flexiblePickup !== false;
          setFlexiblePickup(itemFlexiblePickup);
          setValue('flexiblePickup', itemFlexiblePickup);
          if (item.pickupTimeStart) {
            setValue('pickupTimeStart', new Date(item.pickupTimeStart).toISOString().slice(0, 16));
          }
          if (item.pickupTimeEnd) {
            setValue('pickupTimeEnd', new Date(item.pickupTimeEnd).toISOString().slice(0, 16));
          }
          setExistingImages(item.images || []);
        } else {
          setError('Item not found');
        }
      } catch (err: any) {
        setError('Failed to fetch item details');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchItem();
  }, [id, setValue]);

  const handleImageChange = (files: File[], deletedPublicIds: string[]) => {
    setImageFiles(files);
    setDeletedImagePublicIds(deletedPublicIds);
  };

  const onSubmit = async (data: EditItemFormData) => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

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
      formData.append('lat', data.lat);
      formData.append('lng', data.lng);
      
      const tags = data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      formData.append('tags', JSON.stringify(tags));

      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      if (deletedImagePublicIds.length > 0) {
        formData.append('deletedImages', JSON.stringify(deletedImagePublicIds));
      }

      await itemsAPI.update(id, formData);

      alert('Item updated successfully!');
      navigate('/my-items');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading item details...</p>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Item</h1>

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
              existingImages={existingImages}
              onChange={handleImageChange}
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

            <div className="space-y-4">
              <AddressInput
                onLocationSelect={(location) => {
                  setValue('lat', location.lat.toString());
                  setValue('lng', location.lng.toString());
                  setCurrentLat(location.lat);
                  setCurrentLng(location.lng);
                }}
              />
              
              {currentLat !== 0 && currentLng !== 0 && (
                <LocationMap
                  lat={currentLat}
                  lng={currentLng}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Latitude"
                type="number"
                step="0.0001"
                {...register('lat')}
                error={errors.lat?.message}
                placeholder="37.7749"
              />

              <FormInput
                label="Longitude"
                type="number"
                step="0.0001"
                {...register('lng')}
                error={errors.lng?.message}
                placeholder="-122.4194"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Updating Item...' : 'Update Item'}
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
