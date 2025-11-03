import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { addMonths } from 'date-fns';
import asyncHandler from '../../utils/asyncHandler';
import { AuthRequest } from '../../types/types';
import ApiError from '../../utils/apiError';
import User from '../../models/user.model';
import ApiResponse from '../../utils/apiResponse';
import {
  fullnameSchema,
  usernameSchema,
  resetPasswordSchema,
  changePasswordSchema,
  changeProfileImageSchema,
  profileDescriptionSchema,
  userPersonalitySchema,
  getUsersSchema,
} from '../../validators/user.validators';
import SecretCode from '../../models/secretCode.model';
import { uploadToCloudinary, deleteFromCloudinary, cloudinary } from '../../services/cloudinary';
import contentModerator from '../../moderator/contentModerator';
import createNotification from '../../notification/notification';
import { runInTransaction } from '../../services/mongoose';

// *************************************************************
// GET USER's OWN DETAILS
// *************************************************************

export const getMyDetails = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const user = await User.findById(verifiedUser._id)
    .select(
      '-password -refreshToken -registeredBy -lastUsernameChanged -usernameCooldown -creations -drafts -communications -__v'
    )
    .populate([
      { path: 'notifications.emitter', select: 'fullname profileImage' },
      { path: 'notifications.receiverCharacter', select: 'name avatarImage characterImage' },
    ]);

  if (!user) {
    return next(new ApiError(401, 'User does not exist!'));
  }

  res.status(200).json(new ApiResponse({ user }));
});

// *************************************************************
// GET OTHER USER DETAIL
// *************************************************************

export const getUserDetails = asyncHandler(async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = req.params.id;

  const user = await User.findById(userId).select(
    'fullname profileImage profileDescription subscriberCount subscribingCount totalFollowers creationCount personality mbti enneagram attachmentStyle'
  );

  if (!user) {
    return next(new ApiError(404, 'User does not exist!'));
  }

  res.status(200).json(new ApiResponse({ user }));
});

// *************************************************************
// LOAD MULTIPLE USERS
// *************************************************************

export const loadUsers = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const { data, error } = getUsersSchema.safeParse(req.query);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { type: userType, page } = data;

  const limit = 20;
  const skip = (page - 1) * limit;

  const populatedUser = await User.findById(verifiedUser._id)
    .select({ subscribers: { $slice: [skip, limit] }, subscribing: { $slice: [skip, limit] } })
    .populate(userType, 'fullname profileImage totalFollowers');

  if (!populatedUser) {
    return next(new ApiError(500, 'Failed to load users!'));
  }

  const users = populatedUser[userType];

  res.status(200).json(
    new ApiResponse({
      users,
      currentPage: page,
      totalCount: verifiedUser[userType].length,
      hasMore: skip + users.length < verifiedUser[userType].length,
    })
  );
});

// *************************************************************
// TOGGLE TWO-FACTOR AUTHENTICATION
// *************************************************************

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

// *************************************************************
// CHANGE USERNAME
// *************************************************************

export const changeUsername = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(new ApiError(400, 'Empty Request Body: Please provide new username!'));
  }

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

// *************************************************************
// CHANGE FULLNAME
// *************************************************************

export const changeFullname = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(new ApiError(400, 'Empty Request Body: Please provide new fullname!'));
  }

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

// *************************************************************
// RESET PASSWORD
// *************************************************************

export const resetPassword = asyncHandler(async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(400, 'Empty Request Body: Please provide secretCode, newPassword and email!')
    );
  }

  const { data, error } = resetPasswordSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { secretCode, newPassword, email } = data;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ApiError(404, 'User does not exist!'));
  }

  const code = await SecretCode.findOne({ userId: user._id });

  if (!code) {
    return next(new ApiError(400, 'Please request a new OTP!'));
  }

  const isMatching = await bcrypt.compare(secretCode, code.code);

  if (!isMatching) {
    return next(new ApiError(400, 'Please request a new OTP!'));
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();

  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(null, 'Password reset successfully.'));
});

// *************************************************************
// CHANGE PASSWORD
// *************************************************************

export const changePassword = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(400, 'Empty Request Body: Please provide currentPassword and newPassword!')
    );
  }

  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { data, error } = changePasswordSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { currentPassword, newPassword } = data;

  const isMatching = await verifiedUser.isPasswordCorrect(currentPassword);

  if (!isMatching) {
    return next(new ApiError(400, 'Current password is incorrect!'));
  }

  verifiedUser.password = newPassword;
  verifiedUser.passwordChangedAt = new Date();

  await verifiedUser.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(null, 'Password changed successfully.'));
});

// *************************************************************
// CHANGE PROFILE PICTURE
// *************************************************************

export const changeProfileImage = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { data, error } = changeProfileImageSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { deleteImage } = data;

  if (deleteImage === 'true') {
    if (!verifiedUser.profileImage || !verifiedUser.profileImageId) {
      return next(new ApiError(400, 'You do not have profile image to remove!'));
    }

    const deleteResult = await deleteFromCloudinary(
      verifiedUser.profileImageId,
      'image',
      cloudinary
    );

    if (!deleteResult || !['ok', 'not found'].includes(deleteResult.result)) {
      return next(new ApiError(500, 'Failed to remove image because of internal server error!'));
    }

    const updated = await User.findByIdAndUpdate(
      verifiedUser._id,
      { $set: { profileImage: '', profileImageId: '' } },
      { new: true }
    ).select('+profileImageId');

    if (!updated || updated.profileImage !== '' || updated.profileImageId !== '') {
      return next(new ApiError(500, 'Failed to remove image because of internal server error!'));
    }

    return res.status(200).json(new ApiResponse(null, 'Profile image is successfully removed.'));
  }

  const imageFile = req.file;

  if (!imageFile) {
    return next(new ApiError(400, 'Please upload a profile image!'));
  }

  if (verifiedUser.profileImageId) {
    const deleteResult = await deleteFromCloudinary(
      verifiedUser.profileImageId,
      'image',
      cloudinary
    );

    if (!deleteResult || !['ok', 'not found'].includes(deleteResult.result)) {
      return next(new ApiError(500, 'Image upload failed because of internal server error!.'));
    }
  }

  const filePath = imageFile.path;

  const uploadResult = await uploadToCloudinary(filePath, 'profileImages', {
    cloudinary,
    deleteTempFile: true,
  });

  if (!uploadResult) {
    return next(new ApiError(500, 'Image upload failed because of internal server error!.'));
  }

  const updated = await User.findByIdAndUpdate(
    verifiedUser._id,
    { $set: { profileImage: uploadResult.secure_url, profileImageId: uploadResult.public_id } },
    { new: true }
  ).select('+profileImageId');

  if (
    !updated ||
    updated.profileImage !== uploadResult.secure_url ||
    updated.profileImageId !== uploadResult.public_id
  ) {
    return next(new ApiError(500, 'Image upload failed because of internal server error!.'));
  }

  res.status(200).json(new ApiResponse(null, 'Profile image is successfully updated.'));
});

// *************************************************************
// UPDATE DESCRIPTION
// *************************************************************

export const setDescription = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(new ApiError(400, 'Empty Request Body: Please provide profileDescription!'));
  }

  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { data, error } = profileDescriptionSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { profileDescription } = data;

  const isDescriptionSafe = await contentModerator(profileDescription);

  if (!isDescriptionSafe) {
    return next(
      new ApiError(400, 'Description contain sensitive content! Please provide a safe description.')
    );
  }

  const updated = await User.findByIdAndUpdate(
    verifiedUser._id,
    { $set: { profileDescription } },
    { new: true }
  );

  if (!updated || updated.profileDescription !== profileDescription) {
    return next(new ApiError(500, 'Description update failed because of internal server error!'));
  }

  res.status(200).json(new ApiResponse(null, 'Description is successfully updated.'));
});

// *************************************************************
// UPDATE PERSONALITY
// *************************************************************

export const setPersonality = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(
        400,
        'Empty Request Body: Please provide gender, personality, mbti, enneagram, and attachmentStyle!'
      )
    );
  }

  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { data, error } = userPersonalitySchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const personalityData = data;

  if (personalityData.personality && personalityData.personality.length >= 3) {
    const isPersonalitySafe = await contentModerator(personalityData.personality);

    if (!isPersonalitySafe) {
      return next(
        new ApiError(
          400,
          'Personality contain sensitive content! Please provide a safe personality.'
        )
      );
    }
  }

  const updated = await User.findByIdAndUpdate(
    verifiedUser._id,
    { $set: personalityData },
    { new: true }
  );

  if (
    !updated ||
    (updated.personality && updated.personality !== personalityData.personality) ||
    updated.gender !== personalityData.gender
  ) {
    return next(new ApiError(500, 'Personality update failed because of internal server error!'));
  }

  res.status(200).json(new ApiResponse(null, 'Personality is successfully updated.'));
});

// *************************************************************
// SUBSCRIBE USER
// *************************************************************

export const subscribe = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const subscribeeId = req.params.id;

  const subscribeeUser = await User.findById(subscribeeId);

  if (!subscribeeUser) {
    return next(new ApiError(404, 'User does not exist!'));
  }

  if (verifiedUser._id.equals(subscribeeId)) {
    return next(new ApiError(400, 'You cannot subscribe to yourself!'));
  }

  let action: 'subscribe' | 'unsubscribe' = 'subscribe';

  if (!verifiedUser.subscribing.some(id => id.equals(subscribeeId))) {
    action = 'subscribe';

    const result = await runInTransaction(async session => {
      const updatedSubscriber = await User.findByIdAndUpdate(
        verifiedUser._id,
        { $addToSet: { subscribing: subscribeeUser._id }, $inc: { subscribingCount: 1 } },
        { new: true, session }
      );

      const updatedSubscribee = await User.findByIdAndUpdate(
        subscribeeId,
        { $addToSet: { subscribers: verifiedUser._id }, $inc: { subscriberCount: 1 } },
        { new: true, session }
      );

      if (!updatedSubscriber || !updatedSubscribee) {
        throw new Error('Subscription failed because of internal server error!');
      }
    });

    if (result === 'error') {
      return next(new ApiError(500, 'Subscription failed because of internal server error!'));
    }

    await createNotification('subscribe', verifiedUser._id, { receiverUser: subscribeeUser._id });
  } else {
    action = 'unsubscribe';

    const result = await runInTransaction(async session => {
      const updatedSubscriber = await User.findByIdAndUpdate(
        verifiedUser._id,
        { $pull: { subscribing: subscribeeUser._id }, $inc: { subscribingCount: -1 } },
        { new: true, session }
      );

      const updatedSubscribee = await User.findByIdAndUpdate(
        subscribeeId,
        { $pull: { subscribers: verifiedUser._id }, $inc: { subscriberCount: -1 } },
        { new: true, session }
      );

      if (!updatedSubscriber || !updatedSubscribee) {
        throw new Error('Unsubscription failed because of internal server error!');
      }
    });

    if (result === 'error') {
      return next(new ApiError(500, 'Unsubscription failed because of internal server error!'));
    }
  }

  res
    .status(200)
    .json(new ApiResponse(null, `${subscribeeUser.username} is successfully ${action}d.`));
});
