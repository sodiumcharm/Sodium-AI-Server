import { Request } from 'express';
import { FileFilterCallback } from 'multer';
import ApiError from '../utils/apiError';

export const imageFilter = function (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Unsupported Image file format: ${file.mimetype}!`) as any, false);
  }
};

export const characterDataFilter = function (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  if (file.fieldname === 'music') {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid audio file format!') as any, false);
    }
  } else if (file.fieldname === 'characterImage' || file.fieldname === 'characterAvatar') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid image file format!') as any, false);
    }
  }
};
