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
