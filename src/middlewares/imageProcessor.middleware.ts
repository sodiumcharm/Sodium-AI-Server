import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types/types';
import { NextFunction, Response } from 'express';
import ApiError from '../utils/apiError';

export const processImage = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.file) {
    return next(new ApiError(400, 'No image file found in the request!'));
  }

  const imageBuffer = req.file?.buffer;

  if (!imageBuffer) {
    return next(new ApiError(400, 'No image file found in the request!'));
  }

  const processedPath = path.join('./public/temp', `${uuidv4()}-${Date.now()}.jpg`);

  await sharp(imageBuffer).resize(500, 500).jpeg({ quality: 90 }).toFile(processedPath);

  req.file.path = processedPath;

  next();
});
