import { Response, NextFunction } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import { AuthRequest } from '../../types/types';
import ApiError from '../../utils/apiError';
import ApiResponse from '../../utils/apiResponse';
import User from '../../models/user.model';
import PersonalityResult from '../../models/personalityResult.model';
import { mbtiScoreSchema } from '../../validators/assessment.validators';
import { assessSelfEsteem, determineMBTI } from '../../personalityAssessment/assessments';
import mbtiQuestions from '../../personalityAssessment/mbtiQuestions';
import hfClient from '../../llm/huggingFace/huggingFace';
import { MAX_SELF_ESTEEM_SCORE, MIN_SELF_ESTEEM_SCORE } from '../../constants';
import selfEsteemQuestions from '../../personalityAssessment/selfesteemQuestions';
import { numericStringSchema } from '../../validators/general.validators';

// *************************************************************
// GET MBTI ASSESSMENT QUESTIONS
// *************************************************************

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

  if (page < 1 || page > mbtiQuestions.length / 10) {
    return next(new ApiError(400, 'Invalid page value!'));
  }

  const limit = 10;

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const indexOfLastQuestion = mbtiQuestions.length - 1;

  const paginated = mbtiQuestions.slice(startIndex, endIndex);

  res
    .status(200)
    .json(
      new ApiResponse(
        {
          mbtiQuestions: paginated,
          currentPage: page,
          totalCount: mbtiQuestions.length,
          hasMore: indexOfLastQuestion > endIndex,
        },
        'You have successfully received assessment questions.'
      )
    );
});

// *************************************************************
// GET SELF-ESTEEM ASSESSMENT QUESTIONS
// *************************************************************

export const getSelfEsteemAssessment = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const page = parseInt(req.params.page);

  if (page < 1 || page > selfEsteemQuestions.length / 10) {
    return next(new ApiError(400, 'Invalid page value!'));
  }

  const limit = 10;

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginated = selfEsteemQuestions.slice(startIndex, endIndex);

  res
    .status(200)
    .json(
      new ApiResponse(
        { selfEsteemQuestions: paginated },
        'You have successfully received assessment questions.'
      )
    );
});

// *************************************************************
// GET ASSESSMENT RESULTS
// *************************************************************

export const getAssessmentResults = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { page } = req.params;

  const { data: currentPage, error } = numericStringSchema.safeParse(page);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const limit = 20;
  const skip = (currentPage - 1) * limit;

  const [results, totalCount] = await Promise.all([
    PersonalityResult.find({ userId: verifiedUser._id })
      .select('testName result createdAt')
      .skip(skip)
      .limit(limit),
    await PersonalityResult.countDocuments({ userId: verifiedUser._id }),
  ]);

  if (!results) {
    return next(new ApiError(500, 'Failed to fetch assessment results!'));
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        { results, currentPage, totalCount, hasMore: totalCount > skip + results.length },
        'You have successfully received assessment results.'
      )
    );
});

// *************************************************************
// GET ASSESSMENT RESULT DETAILS
// *************************************************************

export const getAssessmentResultDetails = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { resultId } = req.params;

  const result = await PersonalityResult.findById(resultId);

  if (!result) {
    return next(new ApiError(404, 'Assessment result not found!'));
  }

  if (!result.userId.equals(verifiedUser._id)) {
    return next(
      new ApiError(403, 'Forbidden access! You do not have permission to view this result.')
    );
  }

  res
    .status(200)
    .json(new ApiResponse({ result }, 'You have successfully received assessment result details.'));
});

// *************************************************************
// CREATE MBTI ASSESSMENT RESULT
// *************************************************************

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

  const result = await determineMBTI(scores, verifiedUser, hfClient);

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

// *************************************************************
// CREATE SELF-ESTEEM ASSESSMENT RESULT
// *************************************************************

export const createSelfEsteemResult = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { selfEsteemScore } = req.params;

  const score = Number(selfEsteemScore);

  if (isNaN(score) || score < MIN_SELF_ESTEEM_SCORE || score > MAX_SELF_ESTEEM_SCORE) {
    return next(new ApiError(400, 'Invalid self-esteem score!'));
  }

  const result = await assessSelfEsteem(score, verifiedUser, hfClient);

  if (!result.success) {
    return next(new ApiError(500, 'Failed to analyze the result!'));
  }

  const resultDoc = await PersonalityResult.create({
    userId: verifiedUser._id,
    testName: 'selfEsteem',
    result: result.selfEsteemPercent,
    details: result.details,
  });

  if (!resultDoc) {
    return next(new ApiError(500, 'Failed to save the result!'));
  }

  res.status(200).json(new ApiResponse({ result }, 'Self-esteem was analyzed successfully.'));
});
