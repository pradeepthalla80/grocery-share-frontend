import { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { extractCloudinaryPublicId } from '../utils/cloudinary';

interface ImageUploadProps {
  maxImages?: number;
  existingImages?: string[];
  onChange: (files: File[], deletedPublicIds: string[]) => void;
  error?: string;
}

const isHEIC = (file: File): boolean => {
  const name = file.name.toLowerCase();
  return name.endsWith('.heic') || name.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';
};

const processImageFile = (file: File, maxDimension = 2048): Promise<{ processedFile: File; previewUrl: string }> => {
  return new Promise((resolve, reject) => {
    if (isHEIC(file)) {
      const previewUrl = URL.createObjectURL(file);
      resolve({ processedFile: file, previewUrl });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          if (width <= maxDimension && height <= maxDimension && file.type === 'image/jpeg') {
            const previewUrl = URL.createObjectURL(file);
            resolve({ processedFile: file, previewUrl });
            return;
          }

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round(height * (maxDimension / width));
              width = maxDimension;
            } else {
              width = Math.round(width * (maxDimension / height));
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ processedFile: file, previewUrl: URL.createObjectURL(file) });
            return;
          }

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const pixelCheck = ctx.getImageData(Math.floor(width / 2), Math.floor(height / 2), 1, 1).data;
          if (pixelCheck[0] === 0 && pixelCheck[1] === 0 && pixelCheck[2] === 0 && pixelCheck[3] === 0) {
            resolve({ processedFile: file, previewUrl: URL.createObjectURL(file) });
            return;
          }

          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size < 1000) {
                resolve({ processedFile: file, previewUrl: URL.createObjectURL(file) });
                return;
              }
              const processedFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              const previewUrl = URL.createObjectURL(blob);
              resolve({ processedFile, previewUrl });
            },
            'image/jpeg',
            0.85
          );
        } catch {
          resolve({ processedFile: file, previewUrl: URL.createObjectURL(file) });
        }
      };
      img.onerror = () => {
        resolve({ processedFile: file, previewUrl: URL.createObjectURL(file) });
      };
      img.src = e.target?.result as string;
    };
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

  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const totalImages = displayedExisting.length + files.length + selectedFiles.length;

    if (totalImages > maxImages) {
      alert(`You can only upload up to ${maxImages} images total`);
      return;
    }

    const validFiles = selectedFiles.filter(file => {
      const isImage = file.type.startsWith('image/') || file.name.toLowerCase().match(/\.(heic|heif|jpg|jpeg|png|gif|webp|bmp)$/);
      if (!isImage) {
        alert(`${file.name} is not a valid image file`);
      }
      return isImage;
    });

    if (validFiles.length === 0) return;

    setProcessing(true);
    try {
      const processed = await Promise.all(validFiles.map(f => processImageFile(f)));
      const processedFiles = processed.map(p => p.processedFile);
      const processedPreviews = processed.map(p => p.previewUrl);

      const newFiles = [...files, ...processedFiles];
      setFiles(newFiles);
      setPreviews(prev => [...prev, ...processedPreviews]);
      onChange(newFiles, deletedPublicIds);
    } catch {
      const newFiles = [...files, ...validFiles];
      setFiles(newFiles);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
      onChange(newFiles, deletedPublicIds);
    } finally {
      setProcessing(false);
    }

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
        accept="image/*,.heic,.heif"
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
