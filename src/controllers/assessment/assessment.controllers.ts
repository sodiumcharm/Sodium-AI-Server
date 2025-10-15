import { Response, NextFunction } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import { AuthRequest } from '../../types/types';
import ApiError from '../../utils/apiError';
import ApiResponse from '../../utils/apiResponse';
import User from '../../models/user.model';
import PersonalityResult from '../../models/personalityResult.model';
import { mbtiScoreSchema } from '../../validators/assessment.validators';
import { determineMBTI } from '../../personalityAssessment/assessments';
import mbtiQuestions from '../../personalityAssessment/mbtiQuestions';

export const getMbtiAssessment = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const page = parseInt(req.params.page);

  if (page < 1 || page > 8) {
    return next(new ApiError(400, 'Invalid page value!'));
  }

  const limit = 10;

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginated = mbtiQuestions.slice(startIndex, endIndex);

  res
    .status(200)
    .json(
      new ApiResponse(
        { mbtiQuestions: paginated },
        'You have successfully received assessment questions.'
      )
    );
});

export const createMbtiResult = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(400, 'Empty Request Body: Please provide scores for cognitive functions!')
    );
  }

  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { data, error } = mbtiScoreSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const scores = data;

  const result = await determineMBTI(scores, verifiedUser);

  if (!result.success) {
    return next(new ApiError(500, 'Failed to analyze the result!'));
  }

  const resultDoc = await PersonalityResult.create({
    userId: verifiedUser._id,
    testName: 'mbti',
    mbtiAnalysis: result.score,
    result: result.type,
    details: result.details,
  });

  if (!resultDoc) {
    return next(new ApiError(500, 'Failed to save the result!'));
  }

  res.status(200).json(new ApiResponse({ result }, 'Personality was analyzed successfully.'));
});
