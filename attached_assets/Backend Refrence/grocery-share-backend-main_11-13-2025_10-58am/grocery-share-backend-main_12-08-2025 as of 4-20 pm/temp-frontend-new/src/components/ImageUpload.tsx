import { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { extractCloudinaryPublicId } from '../utils/cloudinary';

interface ImageUploadProps {
  maxImages?: number;
  existingImages?: string[];
  onChange: (files: File[], deletedPublicIds: string[]) => void;
  error?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  maxImages = 5,
  existingImages = [],
  onChange,
  error,
}) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [deletedPublicIds, setDeletedPublicIds] = useState<string[]>([]);
  const [displayedExisting, setDisplayedExisting] = useState<string[]>(existingImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayedExisting(existingImages);
  }, [existingImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const totalImages = displayedExisting.length + files.length + selectedFiles.length;

    if (totalImages > maxImages) {
      alert(`You can only upload up to ${maxImages} images total`);
      return;
    }

    const validFiles = selectedFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        alert(`${file.name} is not a valid image file`);
      }
      return isImage;
    });

    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);

    onChange(newFiles, deletedPublicIds);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    const newPreviews = previews.filter((_, i) => i !== index);
    const newFiles = files.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    setFiles(newFiles);
    onChange(newFiles, deletedPublicIds);
  };

  const removeExistingImage = (url: string) => {
    const publicId = extractCloudinaryPublicId(url);
    if (!publicId) {
      console.error('Could not extract public_id from URL:', url);
      return;
    }
    
    const newDisplayed = displayedExisting.filter(img => img !== url);
    const newDeleted = [...deletedPublicIds, publicId];
    setDisplayedExisting(newDisplayed);
    setDeletedPublicIds(newDeleted);
    onChange(files, newDeleted);
  };

  const totalImages = displayedExisting.length + files.length;
  const canAddMore = totalImages < maxImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Images ({totalImages}/{maxImages})
        </label>
        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Images
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {totalImages === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 cursor-pointer transition-colors"
        >
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Click to upload images or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, GIF up to 5MB each (max {maxImages} images)
          </p>
        </div>
      )}

      {totalImages > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {displayedExisting.map((url, index) => (
            <div key={`existing-${index}`} className="relative group">
              <img
                src={url}
                alt={`Existing ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-green-500"
              />
              <div className="absolute top-0 right-0 left-0 bottom-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeExistingImage(url)}
                  className="opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <span className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                Existing
              </span>
            </div>
          ))}

          {previews.map((preview, index) => (
            <div key={`new-${index}`} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-blue-500"
              />
              <div className="absolute top-0 right-0 left-0 bottom-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                New
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
