import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError';
import User from '../models/user.model.js';
import { config } from '../config/config.js';
import { AuthRequest } from '../types/types.js';

export const verifyAuth = asyncHandler(async function (req: AuthRequest, _, next: NextFunction) {
  try {
    const token: string = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new ApiError(401, 'Unauthorized request denied! Access token missing.'));
    }

    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);

    if (typeof decoded === 'string') {
      return next(new ApiError(401, 'Invalid access token!'));
    }

    const user = await User.findById(decoded._id);

    if (!user) {
      return next(new ApiError(401, 'The user belongs to this token does no longer exist!'));
    }

    if (typeof decoded.iat === 'undefined') {
      return next(
        new ApiError(
          500,
          `${config.NODE_ENV === 'production' ? 'Authorization Error!' : 'Invalid Access Token: Missing iat!'}`
        )
      );
    }

    if (user.isPasswordChangedAfter(decoded.iat)) {
      return next(
        new ApiError(401, 'User changed password after issuing this token! Please login again.')
      );
    }

    req.user = user;

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError && error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'token_expired'));
    }
    return next(new ApiError(401, 'Invalid access token!'));
  }
});

export const softAuthChecker = asyncHandler(async function (
  req: AuthRequest,
  _,
  next: NextFunction
) {
  try {
    const token: string = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

    if (!token) return next();

    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);

    if (typeof decoded === 'string') return next();

    const user = await User.findById(decoded._id);

    if (!user) return next();

    if (typeof decoded.iat === 'undefined') return next();

    if (user.isPasswordChangedAfter(decoded.iat)) return next();

    req.user = user;

    next();
  } catch (error) {
    next();
  }
});
