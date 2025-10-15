import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/types';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/apiError';
import ApiResponse from '../../utils/apiResponse';
import { generateImage, generateRandomContent } from './generator.utils';
import { imageGenerationSchema } from '../../validators/generator.validators';
import { uploadToCloudinary } from '../../services/cloudinary';
import Image from '../../models/image.model';
import contentModerator from '../../moderator/contentModerator';
import User from '../../models/user.model';
import { runInTransaction } from '../../services/mongoose';

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

export const createImage = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(
        400,
        'Empty Request Body: Please provide style, an optional prompt and an optional referenceImage in the request body!'
      )
    );
  }

  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const { data, error } = imageGenerationSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { style, prompt } = data;

  if (prompt === 'Direct Upload') {
    return next(new ApiError(400, 'This prompt is not allowed!'));
  }

  if (prompt) {
    const isSafePrompt = await contentModerator(prompt);

    if (!isSafePrompt) {
      return next(new ApiError(400, 'This prompt contains prohibited content!'));
    }
  }

  const uploadedReferenceImagePath = req.file?.path;

  const generatedImagePath = await generateImage(prompt, style, uploadedReferenceImagePath);

  if (!generatedImagePath) {
    return next(
      new ApiError(
        500,
        'Failed to generate image (Possible reason: Image generation quota exceeded)!'
      )
    );
  }

  const imageUploadResult = await uploadToCloudinary(generatedImagePath, 'images');

  if (!imageUploadResult) {
    return next(new ApiError(500, 'Failed to save generated image!'));
  }

  const result = await runInTransaction(async session => {
    const imageDocArr = await Image.create(
      [
        {
          image: imageUploadResult.secure_url,
          imageId: imageUploadResult.public_id,
          usedPrompt: prompt || 'No Prompt',
        },
      ],
      { session }
    );

    if (!imageDocArr || imageDocArr.length === 0) {
      throw new Error('Image creation failed!');
    }

    const updatedUser = await User.findByIdAndUpdate(
      verifiedUser._id,
      {
        $addToSet: { savedImages: imageDocArr[0]._id },
      },
      { new: true, session }
    );

    if (!updatedUser || !updatedUser.savedImages.some(id => id.equals(imageDocArr[0]._id))) {
      throw new Error('Database update failed!');
    }

    return imageDocArr[0];
  });

  if (result === 'error') {
    return next(new ApiError(500, 'Failed to save generated image!'));
  }

  res.status(201).json(new ApiResponse({ generatedImage: result }, 'Image generation successful.'));
});
