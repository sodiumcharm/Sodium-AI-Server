import { Response, NextFunction } from 'express';
import { addMonths } from 'date-fns';
import asyncHandler from '../../utils/asyncHandler';
import { AuthRequest } from '../../types/types';
import ApiError from '../../utils/apiError';
import User from '../../models/user.model';
import ApiResponse from '../../utils/apiResponse';
import { fullnameSchema, usernameSchema } from '../../validators/user.validators';

export const toggle2FA = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const updated = await User.findByIdAndUpdate(
    verifiedUser._id,
    { $set: { twoFAEnabled: !verifiedUser.twoFAEnabled } },
    { new: true }
  );

  if (!updated || updated.twoFAEnabled === verifiedUser.twoFAEnabled) {
    return next(new ApiError(500, 'Failed to toggle two-factor authentication!'));
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        { twoFAEnabled: updated.twoFAEnabled },
        updated.twoFAEnabled
          ? 'Two-factor authentication enabled.'
          : 'Two-factor authentication disabled.'
      )
    );
});

export const changeUsername = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const { data, error } = usernameSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { username } = data;

  const now = new Date();

  if (verifiedUser.lastUsernameChanged) {
    const nextAllowedChange = addMonths(
      verifiedUser.lastUsernameChanged,
      verifiedUser.usernameCooldown
    );

    if (now < nextAllowedChange) {
      return next(
        new ApiError(
          400,
          `Next username change is allowed after ${verifiedUser.usernameCooldown} months! Your cooldown will end after ${nextAllowedChange.toLocaleDateString()}.`
        )
      );
    }
  }

  const cooldown = verifiedUser.lastUsernameChanged ? verifiedUser.usernameCooldown * 2 : 2;

  const updated = await User.findByIdAndUpdate(
    verifiedUser._id,
    { $set: { username, lastUsernameChanged: now, usernameCooldown: cooldown } },
    { new: true }
  );

  if (!updated || updated.username !== username) {
    return next(new ApiError(500, 'Failed to change username!'));
  }

  res.status(200).json(new ApiResponse(null, 'Username changed successfully.'));
});

export const changeFullname = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { data, error } = fullnameSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { fullname } = data;

  const updated = await User.findByIdAndUpdate(
    verifiedUser._id,
    { $set: { fullname } },
    { new: true }
  );

  if (!updated || updated.fullname !== fullname) {
    return next(new ApiError(500, 'Failed to change fullname!'));
  }

  res.status(200).json(new ApiResponse(null, 'Display name is successfully changed.'));
});
