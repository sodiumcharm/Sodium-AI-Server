import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/types';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/apiError';
import ApiResponse from '../../utils/apiResponse';
import { generateTokens } from '../auth/auth.utils';
import { accessTokenCookieOption, refreshTokenCookieOption } from '../../config/cookie';

export const oAuthSignIn = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(500, 'Failed to sign in user! Try again later.'));
  }

  const result = await generateTokens(verifiedUser);

  if (!result.success.success) {
    return next(new ApiError(result.success.statusCode, result.success.message));
  }

  const { accessToken, refreshToken, user: updatedUser } = result;

  res
    .status(200)
    .cookie('accessToken', accessToken, accessTokenCookieOption)
    .cookie('refreshToken', refreshToken, refreshTokenCookieOption)
    .json(new ApiResponse({ user: updatedUser }));
});
