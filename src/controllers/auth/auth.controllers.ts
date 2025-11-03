import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/apiError';
import ApiResponse from '../../utils/apiResponse';
import User from '../../models/user.model';
import { registerSchema, loginSchema } from '../../validators/auth.validators';
import { UploadApiResponse } from 'cloudinary';
import { cloudinary, uploadToCloudinary } from '../../services/cloudinary';
import { accessTokenCookieOption, refreshTokenCookieOption } from '../../config/cookie';
import generateWelcomeEmail from '../../templates/welcome.mail';
import sendMail from '../../config/nodemailer';
import { AuthRequest, UserDocument } from '../../types/types';
import generateLoginAttemptEmail from '../../templates/loginAttempt.mail';
import { createAndSendOTP, verifyOTP } from '../otp/otp.utils';
import { otpVerificationSchema } from '../../validators/otp.validators';
import { generateTokens } from './auth.utils';

// *************************************************************
// REGISTER USER
// *************************************************************

export const registerUser = asyncHandler(async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(
        400,
        'Empty Request Body: Please provide fullname, username, email and password for sign up!'
      )
    );
  }

  const { data, error } = registerSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { fullname, username, email, password } = data;

  const [existingUserWithUsername, existingUserWithEmail] = await Promise.all([
    User.findOne({ username }),
    User.findOne({ email }),
  ]);

  if (existingUserWithUsername) {
    return next(new ApiError(400, 'This username is already taken!'));
  }

  if (existingUserWithEmail) {
    return next(new ApiError(400, 'This email address is already registered!'));
  }

  let profileImagePath: string | undefined;

  if (req.file) {
    profileImagePath = req.file.path;
  }

  let uploadResult: UploadApiResponse | null = null;

  if (profileImagePath) {
    uploadResult = await uploadToCloudinary(profileImagePath, 'profileImages', {
      cloudinary,
      deleteTempFile: true,
    });

    if (!uploadResult) {
      return next(new ApiError(500, 'Profile image upload failed!'));
    }
  }

  const user = await User.create({
    fullname,
    username,
    registeredBy: 'credentials',
    email,
    password,
    profileImage: uploadResult?.secure_url || '',
    profileImageId: uploadResult?.public_id || '',
  });

  if (!user) {
    return next(new ApiError(500, 'Sign up failed! Please try again.'));
  }

  const result = await generateTokens(user);

  if (!result.success.success) {
    return next(new ApiError(result.success.statusCode, result.success.message));
  }

  const { accessToken, refreshToken, user: newUser } = result;

  res
    .status(201)
    .cookie('accessToken', accessToken, accessTokenCookieOption)
    .cookie('refreshToken', refreshToken, refreshTokenCookieOption)
    .json(new ApiResponse({ user: newUser }));

  const { subject, text, html } = generateWelcomeEmail(fullname);

  await sendMail(email, subject, text, html);
});

// *************************************************************
// LOGIN USER
// *************************************************************

export const signInUser = asyncHandler(async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(
        400,
        'Empty Request Body: Please provide email or username and password for login!'
      )
    );
  }

  const { data, error } = loginSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { username, email, password } = data;

  let identifierType = 'username';
  let user: UserDocument | null;

  if (email) identifierType = 'email';
  if (username && email) identifierType = 'username-email';

  if (identifierType === 'username-email') {
    user = await User.findOne({ email: email });
  } else {
    user = await User.findOne({
      $or: [{ email: email }, { username: username }],
    });
  }

  const isMatchingPassword = await user?.isPasswordCorrect(password);

  if (!user || !isMatchingPassword) {
    if (user) {
      const { subject, text, html } = generateLoginAttemptEmail(req, user.fullname);
      const alertEmail = user.email;

      await sendMail(alertEmail, subject, text, html);
    }

    return next(
      new ApiError(
        400,
        `Incorrect ${identifierType === 'email' || identifierType === 'username-email' ? 'email address' : 'username'} or password!`
      )
    );
  }

  if (user.twoFAEnabled && user.isEmailVerified) {
    const sent = await createAndSendOTP(user, '2FA');

    if (!sent) {
      return next(new ApiError(500, 'Failed to send OTP for two-factor authentication!'));
    }

    return res
      .status(202)
      .json(new ApiResponse({ userId: user._id }, 'Two-factor Authentication is required!'));
  }

  const result = await generateTokens(user);

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

// *************************************************************
// LOG IN USER VIA Two-Factor Authentication
// *************************************************************

export const signIn2FA = asyncHandler(async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(new ApiError(400, 'Empty Request Body: Please provide otp and userId for login!'));
  }

  const { data, error } = otpVerificationSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { userId, otp } = data;

  const context = '2FA';

  const [user, result] = await Promise.all([
    User.findById(userId),
    verifyOTP(userId, otp, context),
  ]);

  if (!user) {
    return next(new ApiError(404, 'User does not exist!'));
  }

  if (!result.success) {
    return next(new ApiError(result.statusCode, result.message));
  }

  const tokenResult = await generateTokens(user);

  if (!tokenResult.success.success) {
    return next(new ApiError(tokenResult.success.statusCode, tokenResult.success.message));
  }

  const { accessToken, refreshToken, user: updatedUser } = tokenResult;

  res
    .status(200)
    .cookie('accessToken', accessToken, accessTokenCookieOption)
    .cookie('refreshToken', refreshToken, refreshTokenCookieOption)
    .json(new ApiResponse({ user: updatedUser }));
});

// *************************************************************
// LOG OUT USER
// *************************************************************

export const signOutUser = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  res
    .status(200)
    .clearCookie('accessToken', accessTokenCookieOption)
    .clearCookie('refreshToken', refreshTokenCookieOption)
    .json(new ApiResponse(null, 'User logged out successfully.'));

  try {
    const verifiedUser = req.user;

    if (!verifiedUser) return;

    const user = await User.findById(verifiedUser._id);

    if (!user) return;

    await User.findByIdAndUpdate(user._id, { $unset: { refreshToken: '' } });
  } catch (error) {
    return;
  }
});
