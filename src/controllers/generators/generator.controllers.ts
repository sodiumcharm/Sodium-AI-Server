import { Response, NextFunction } from 'express';
import { AuthRequest, CharacterDocument } from '../../types/types';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/apiError';
import ApiResponse from '../../utils/apiResponse';
import { generateImage, generateRandomContent } from './generator.utils';
import { imageGenerationSchema } from '../../validators/generator.validators';
import { deleteFromCloudinary, uploadToCloudinary } from '../../services/cloudinary';
import Image from '../../models/image.model';
import contentModerator from '../../moderator/contentModerator';
import { numericStringSchema } from '../../validators/general.validators';

export const getImages = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const { page } = req.params;

  const { data: currentPage, error } = numericStringSchema.safeParse(page);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const limit = 20;
  const skip = (currentPage - 1) * limit;

  const [images, totalCount] = await Promise.all([
    Image.find({ user: verifiedUser._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Image.countDocuments({ user: verifiedUser._id }),
  ]);

  if (!images || isNaN(totalCount)) {
    return next(new ApiError(500, 'Failed to load images!'));
  }

  res.status(200).json(
    new ApiResponse({
      images,
      currentPage,
      totalPages: Math.ceil(totalCount / limit),
      totalCount: totalCount || null,
      hasMore: skip + images.length < totalCount,
    })
  );
});

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

  const imageDoc = await Image.create({
    image: imageUploadResult.secure_url,
    imageId: imageUploadResult.public_id,
    user: verifiedUser._id,
    usedPrompt: prompt || 'No Prompt',
  });

  if (!imageDoc) {
    return next(new ApiError(500, 'Failed to save generated image!'));
  }

  res
    .status(201)
    .json(new ApiResponse({ generatedImage: imageDoc }, 'Image generation successful.'));
});

export const deleteImage = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const { imageId } = req.params;

  const image = await Image.findById(imageId)
    .select('+imageId')
    .populate<{ usedByCharacter: CharacterDocument }>('usedByCharacter', 'name');

  if (!image) {
    return next(new ApiError(404, 'Image does not exist!'));
  }

  if (
    verifiedUser.role === 'user' &&
    (image.usedPrompt === 'Direct Upload' || !image.user.equals(verifiedUser._id))
  ) {
    return next(new ApiError(400, 'You are not allowed to delete this image!'));
  }

  if (image.usedByCharacter) {
    return next(
      new ApiError(400, `This image is being used by your character ${image.usedByCharacter.name}!`)
    );
  }

  const deleteResult = await deleteFromCloudinary(image.imageId, 'image');

  if (!deleteResult || !['ok', 'not found'].includes(deleteResult.result)) {
    return next(new ApiError(500, 'Failed to delete image due to internal server error!'));
  }

  const deletedDoc = await Image.findByIdAndDelete(image._id);

  if (!deletedDoc) {
    return next(new ApiError(500, 'Failed to delete image due to internal server error!'));
  }

  res.status(200).json(new ApiResponse(null, 'Image deleted successfully.'));
});
