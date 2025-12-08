export const extractCloudinaryPublicId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) {
      return null;
    }

    const afterUpload = pathParts.slice(uploadIndex + 1);
    
    const transformationIndex = afterUpload.findIndex(part => 
      !part.startsWith('v') || isNaN(Number(part.substring(1)))
    );
    
    const publicIdParts = transformationIndex === -1 
      ? afterUpload 
      : afterUpload.slice(transformationIndex);
    
    const publicIdWithExtension = publicIdParts.join('/');
    
    const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
    const publicId = lastDotIndex !== -1 
      ? publicIdWithExtension.substring(0, lastDotIndex) 
      : publicIdWithExtension;
    
    return publicId;
  } catch (error) {
    console.error('Failed to extract Cloudinary public_id:', error);
    return null;
  }
};
