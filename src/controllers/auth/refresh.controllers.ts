import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/apiError';
import ApiResponse from '../../utils/apiResponse';
import User from '../../models/user.model';
import { accessTokenCookieOption, refreshTokenCookieOption } from '../../config/cookie';
import { config } from '../../config/config';

export const refreshAccess = asyncHandler(async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    return next(
      new ApiError(
        401,
        `${config.NODE_ENV === 'production' ? 'Unauthorised request denied!' : 'Refresh Token is required!'}`
      )
    );
  }

  try {
    const decoded = jwt.verify(incomingRefreshToken, config.REFRESH_TOKEN_SECRET);

    if (!decoded || typeof decoded === 'string') {
      return next(
        new ApiError(
          401,
          `${config.NODE_ENV === 'production' ? 'Unauthorised request denied!' : 'Invalid or Expired refresh token!'}`
        )
      );
    }

    const user = await User.findById(decoded._id);

    if (!user) {
      return next(new ApiError(401, 'User does no longer exist!'));
    }

    if (!user.refreshToken) {
      return next(
        new ApiError(
          401,
          `${config.NODE_ENV === 'production' ? 'Unauthorised request denied!' : 'Refresh Token is missing from database!'}`
        )
      );
    }

    if (typeof decoded.iat === 'undefined') {
      return next(
        new ApiError(
          500,
          `${config.NODE_ENV === 'production' ? 'Authorization Error!' : 'Invalid Refresh Token: Missing iat!'}`
        )
      );
    }

    if (user.isPasswordChangedAfter(decoded.iat)) {
      return next(new ApiError(401, 'User has changed the password! Please login again.'));
    }

    const isMatching = await bcrypt.compare(incomingRefreshToken, user.refreshToken);

    if (!isMatching) {
      return next(
        new ApiError(
          401,
          `${config.NODE_ENV === 'production' ? 'Unauthorised request denied!' : 'Provided Refresh Token is not matching with the token stored in database!'}`
        )
      );
    }

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

    await User.findByIdAndUpdate(user._id, { $set: { refreshToken: hashedRefreshToken } });

    res
      .status(200)
      .cookie('accessToken', newAccessToken, accessTokenCookieOption)
      .cookie('refreshToken', newRefreshToken, refreshTokenCookieOption)
      .json(new ApiResponse(null, 'Access token refreshed successfully.'));
  } catch (error) {
    return next(
      new ApiError(
        401,
        `${config.NODE_ENV === 'production' ? 'Unauthorised request denied!' : 'Invalid or Expired refresh token!'}`
      )
    );
  }
});
