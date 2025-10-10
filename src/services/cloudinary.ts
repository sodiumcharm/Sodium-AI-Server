import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { config } from '../config/config';
import safelyDeleteFile from '../utils/deleteFile';
import logger from '../utils/logger';
import { CloudinaryDestroyResult } from '../types/types';

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async function (
  localPath: string,
  cloudinaryFilePath: string
): Promise<UploadApiResponse | null> {
  try {
    if (!localPath) return null;

    const result = await cloudinary.uploader.upload(localPath, {
      resource_type: 'auto',
      folder: `SodiumAI/${cloudinaryFilePath}`,
    });
    await safelyDeleteFile(localPath);
    return result;
  } catch (error) {
    logger.error(`Cloudinary Upload Error: ${error}`);
    return null;
  }
};

export const deleteFromCloudinary = async function (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<CloudinaryDestroyResult | null> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    logger.error(error, `Cloudinary Delete Error: ${error}`);
    return null;
  }
};
