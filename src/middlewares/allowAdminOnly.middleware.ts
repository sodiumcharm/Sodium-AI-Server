import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/types';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/apiError';

export const allowAdminOnly = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login.'));
  }

  if (verifiedUser.role !== 'admin') {
    return next(new ApiError(403, 'Forbidden request denied! Admin access required.'));
  }

  next();
});
