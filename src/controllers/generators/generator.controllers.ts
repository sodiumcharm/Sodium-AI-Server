import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/types';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/apiError';
import ApiResponse from '../../utils/apiResponse';
import { generateRandomContent } from './generator.utils';

export const generateTextContent = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const { context } = req.params;

  console.log(context);

  const result = await generateRandomContent(context);

  if (result === 'error') {
    return next(new ApiError(500, 'Failed to generate content!'));
  }

  res.status(200).json(new ApiResponse({ content: result }, 'Content generated successfully.'));
});
