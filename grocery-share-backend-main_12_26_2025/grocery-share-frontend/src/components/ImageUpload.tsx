import { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { extractCloudinaryPublicId } from '../utils/cloudinary';

interface ImageUploadProps {
  maxImages?: number;
  existingImages?: string[];
  onChange: (files: File[], deletedPublicIds: string[]) => void;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

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
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayedExisting(existingImages);
  }, [existingImages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const totalImages = displayedExisting.length + files.length + selectedFiles.length;

    if (totalImages > maxImages) {
      alert(`You can only upload up to ${maxImages} images total`);
      return;
    }

    const validFiles = selectedFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name} is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum is 10MB.`);
        return false;
      }
      const isImage = file.type.startsWith('image/') || file.name.toLowerCase().match(/\.(heic|heif|jpg|jpeg|png|gif|webp|bmp)$/);
      if (!isImage) {
        alert(`${file.name} is not a valid image file`);
      }
      return isImage;
    });

    if (validFiles.length === 0) return;

    setProcessing(true);
    try {
      const dataUrls = await Promise.all(validFiles.map(f => readFileAsDataURL(f)));
      const newFiles = [...files, ...validFiles];
      setFiles(newFiles);
      setPreviews(prev => [...prev, ...dataUrls]);
      onChange(newFiles, deletedPublicIds);
    } catch {
      const fallbackUrls = validFiles.map(f => URL.createObjectURL(f));
      const newFiles = [...files, ...validFiles];
      setFiles(newFiles);
      setPreviews(prev => [...prev, ...fallbackUrls]);
      onChange(newFiles, deletedPublicIds);
    } finally {
      setProcessing(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeNewImage = (index: number) => {
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

      {processing && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing photos...</span>
        </div>
      )}

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
            Tap to upload photos
          </p>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG, HEIC up to 10MB each (max {maxImages} images)
          </p>
        </div>
      )}

      {totalImages > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {displayedExisting.map((url, index) => (
            <div key={`existing-${index}`} className="relative">
              <img
                src={url}
                alt={`Existing ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-green-500"
              />
              <button
                type="button"
                onClick={() => removeExistingImage(url)}
                className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full shadow-md active:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-green-600/80 text-white text-[10px] rounded">
                Saved
              </span>
            </div>
          ))}

          {previews.map((preview, index) => (
            <div key={`new-${index}`} className="relative">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-blue-400"
              />
              <button
                type="button"
                onClick={() => removeNewImage(index)}
                className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full shadow-md active:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-blue-500/80 text-white text-[10px] rounded">
                New
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
