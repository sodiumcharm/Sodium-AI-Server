import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/types';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/apiError';

export const checkEmailVerification = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login.'));
  }

  if (!verifiedUser.isEmailVerified) {
    return next(
      new ApiError(403, `Email verification of ${verifiedUser.email} is required for this action!`)
    );
  }

  next();
});
