import { Response, NextFunction } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/apiError';
import ApiResponse from '../../utils/apiResponse';
import User from '../../models/user.model';
import { AuthRequest } from '../../types/types';
import { cloudinary, uploadToCloudinary } from '../../services/cloudinary';
import { scheduleNotificationSchema } from '../../validators/admin.validators';
import agenda from '../../jobs/agenda';

export const scheduleNotification = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(
        400,
        'Empty Request Body: Please provide notification text, notifyAt and an image!'
      )
    );
  }

  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const { data, error } = scheduleNotificationSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { message, notifyAt } = data;

  const upload = req.file;

  if (!upload) {
    return next(new ApiError(400, 'No image was provided for notification!'));
  }

  const notifyDate = new Date(notifyAt);

  if (isNaN(notifyDate.getTime())) {
    return next(new ApiError(400, 'Invalid notification time provided!'));
  }

  const uploadResult = await uploadToCloudinary(upload.path, 'systemImages', {
    cloudinary,
    deleteTempFile: true,
  });

  if (!uploadResult) {
    return next(new ApiError(500, 'Failed to upload image to Cloudinary!'));
  }

  const result = await agenda.schedule(notifyDate, 'scheduled notification', {
    text: message,
    image: uploadResult.secure_url,
  });

  if (!result) {
    return next(new ApiError(500, 'Failed to schedule notification!'));
  }

  return res.status(200).json(new ApiResponse(null, 'Notification scheduled successfully!'));
});
