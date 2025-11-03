import { NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError';
import User from '../models/user.model.js';
import { AuthRequest } from '../types/types.js';

export const checkMerit = asyncHandler(async function (req: AuthRequest, _, next: NextFunction) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  if (verifiedUser.socialMerit < -1000) {
    return next(new ApiError(403, 'You can not perform this action due to low social merit!'));
  }

  next();
});
