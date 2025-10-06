import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import ApiResponse from '../../utils/apiResponse';
import ApiError from '../../utils/apiError';
import { AuthRequest } from '../../types/types';
import { otpRequestSchema, otpVerificationSchema } from '../../validators/otp.validators';
import { createAndSendOTP, verifyOTP, generateSecretCode } from './otp.utils';
import User from '../../models/user.model';

// *************************************************************
// REQUESTING OTP
// *************************************************************

export const requestOTP = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!req.body) {
    return next(
      new ApiError(
        400,
        'Empty Request Body: Please provide email (not required if user is authenticated) and conext!'
      )
    );
  }

  const { data, error } = otpRequestSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { email, context } = data;

  if (!email && !verifiedUser) {
    return next(new ApiError(400, 'Email address is required!'));
  }

  const user = verifiedUser || (await User.findOne({ email }));

  if (!user) {
    if ((!email && verifiedUser) || (email && verifiedUser)) {
      return next(new ApiError(404, 'OTP request failed as user does not exist!'));
    } else {
      return next(new ApiError(404, 'The email address is not registered!'));
    }
  }

  if ((context === 'forgot-password' || context === '2FA') && !user.isEmailVerified) {
    return next(new ApiError(400, 'Email address must be verified to receive OTP!'));
  }

  const sent = await createAndSendOTP(user, context);

  if (!sent) {
    return next(new ApiError(500, 'OTP request failed!'));
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        { userId: user._id },
        `An OTP was sent to ${user.email}. Please check your email inbox.`
      )
    );
});

// *************************************************************
// VERIFYING OTP
// *************************************************************

export const verifySentOTP = asyncHandler(async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(new ApiError(400, 'Empty Request Body: Please provide otp, context and userId!'));
  }

  const { data, error } = otpVerificationSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { userId, otp, context } = data;

  if (!context || context.trim() === '') {
    return next(new ApiError(400, 'Context is required!'));
  }

  if (context === '2FA') {
    return next(
      new ApiError(
        400,
        'Valid context is required! OTP of Two-factor authentication is not verified here.'
      )
    );
  }

  const result = await verifyOTP(userId, otp, context);

  if (!result.success) {
    return next(new ApiError(result.statusCode, result.message));
  }

  if (context === 'verify-email') {
    await User.findByIdAndUpdate(userId, { $set: { isEmailVerified: true } });
  }

  let generatedCode: string | null = null;

  if (context === 'forgot-password') {
    generatedCode = await generateSecretCode(userId);

    if (!generatedCode) {
      return next(new ApiError(500, 'Failed to verify OTP for reset password!'));
    }
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        { secretCode: generatedCode },
        `${context === 'forgot-password' ? 'reset-password' : 'email-verified'}`
      )
    );
});
