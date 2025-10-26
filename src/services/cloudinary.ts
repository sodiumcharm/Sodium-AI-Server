import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { config } from '../config/config';
import safelyDeleteFile from '../utils/deleteFile';
import logger from '../utils/logger';
import { CloudinaryDependency, CloudinaryDestroyResult } from '../types/types';

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export const uploadToCloudinary = async function (
  localPath: string,
  cloudinaryFilePath: string,
  deps: CloudinaryDependency
): Promise<UploadApiResponse | null> {
  try {
    if (!localPath) return null;

    const result = await deps.cloudinary.uploader.upload(localPath, {
      resource_type: 'auto',
      folder: `SodiumAI/${cloudinaryFilePath}`,
    });

    if (deps.deleteTempFile) await safelyDeleteFile(localPath);

    return result;
  } catch (error) {
    logger.error(error, `Cloudinary Upload Error:`);

    if (deps.deleteTempFile) await safelyDeleteFile(localPath);

    return null;
  }
};

export const deleteFromCloudinary = async function (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image',
  cloudService: typeof cloudinary
): Promise<CloudinaryDestroyResult | null> {
  try {
    if (!publicId || !resourceType) return null;

    const result = await cloudService.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    logger.error(error, `Cloudinary Delete Error: ${error}`);
    return null;
  }
};
