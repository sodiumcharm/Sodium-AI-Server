import { Response, NextFunction } from 'express';
import { UploadApiResponse } from 'cloudinary';
import asyncHandler from '../../utils/asyncHandler';
import {
  AuthRequest,
  CharacterData,
  CharacterDocument,
  DraftData,
  ImageDocument,
} from '../../types/types';
import ApiError from '../../utils/apiError';
import ApiResponse from '../../utils/apiResponse';
import User from '../../models/user.model';
import Character from '../../models/character.model';
import { cloudinary, uploadToCloudinary, deleteFromCloudinary } from '../../services/cloudinary';
import { createDraftSchema } from '../../validators/draft.validators';
import Image from '../../models/image.model';
import { runInTransaction } from '../../services/mongoose';
import Draft from '../../models/draft.model';
import { createCharacterSchema, removeMediaSchema } from '../../validators/character.validators';
import contentModerator from '../../moderator/contentModerator';
import createNotification from '../../notification/notification';
import { numericStringSchema } from '../../validators/general.validators';

// *************************************************************
// LOAD DRAFTS
// *************************************************************

export const loadDrafts = asyncHandler(async function (
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

  const populatedUser = await User.findById(verifiedUser._id)
    .select({ drafts: { $slice: [skip, limit] } })
    .populate<{
      drafts: CharacterDocument[];
    }>('drafts', 'name characterImage avatarImage description');

  if (!populatedUser) {
    return next(new ApiError(500, 'Error while loading your drafts!'));
  }

  const drafts = populatedUser.drafts;

  const totalCount = verifiedUser.drafts.length;

  return res.status(200).json(
    new ApiResponse({
      drafts,
      currentPage,
      totalCount,
      hasMore: skip + drafts.length < totalCount,
    })
  );
});

// *************************************************************
// CREATE DRAFT
// *************************************************************

export const createDraft = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(400, 'Empty Request Body: Please provide character details in the request body!')
    );
  }

  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { data, error } = createDraftSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const draftData: DraftData = data;

  const uploadedFiles = req.files;

  if (!uploadedFiles && Object.values(draftData).length === 0) {
    return next(new ApiError(400, 'No fields were provided!'));
  }

  let characterImage: ImageDocument | null = null;
  if (draftData.imageId) {
    characterImage = await Image.findById(draftData.imageId);

    if (!characterImage) {
      return next(new ApiError(404, 'Image does not exist! Please choose another one.'));
    }

    if (characterImage.usedByCharacter) {
      return next(
        new ApiError(
          400,
          `This image is being already used by one of your character! Please use another image.`
        )
      );
    }
  }

  let characterImagePath: string | null = null;
  let avatarImagePath: string | null = null;
  let musicImagePath: string | null = null;

  if (uploadedFiles) {
    if (
      !draftData.imageId &&
      uploadedFiles.characterImage &&
      uploadedFiles.characterImage.length !== 0
    ) {
      characterImagePath = uploadedFiles.characterImage[0].path;
    }

    if (uploadedFiles.characterAvatar && uploadedFiles.characterAvatar[0].path) {
      avatarImagePath = uploadedFiles.characterAvatar[0].path;
    }

    if (uploadedFiles.music && uploadedFiles.music[0].path) {
      musicImagePath = uploadedFiles.music[0].path;
    }
  }

  let uploadedImageDocument: ImageDocument | null = null;
  let avatarUploadResult: UploadApiResponse | null = null;
  let musicUploadResult: UploadApiResponse | null = null;

  if (characterImagePath) {
    const imageUploadResult = await uploadToCloudinary(characterImagePath, 'images', {
      cloudinary,
      deleteTempFile: true,
    });

    if (!imageUploadResult) {
      return next(new ApiError(500, 'Failed to upload character image!'));
    }

    uploadedImageDocument = await Image.create({
      image: imageUploadResult.secure_url,
      imageId: imageUploadResult.public_id,
      user: verifiedUser._id,
      usedPrompt: 'Direct Upload',
    });

    if (!uploadedImageDocument) {
      return next(new ApiError(500, 'Failed to upload character image!'));
    }
  }

  if (avatarImagePath) {
    avatarUploadResult = await uploadToCloudinary(avatarImagePath, 'images', {
      cloudinary,
      deleteTempFile: true,
    });

    if (!avatarUploadResult) {
      return next(new ApiError(500, 'Failed to upload avatar image!'));
    }
  }

  if (musicImagePath) {
    musicUploadResult = await uploadToCloudinary(musicImagePath, 'musics', {
      cloudinary,
      deleteTempFile: true,
    });

    if (!musicUploadResult) {
      return next(new ApiError(500, 'Failed to upload the music!'));
    }
  }

  draftData.creator = verifiedUser._id.toString();

  if (draftData.imageId || uploadedImageDocument) {
    draftData.characterImage = draftData.imageId || uploadedImageDocument?._id.toString();
  }

  if (avatarUploadResult) {
    draftData.characterAvatar = avatarUploadResult.secure_url;
    draftData.avatarId = avatarUploadResult.public_id;
  }

  if (musicUploadResult) {
    draftData.music = musicUploadResult.secure_url;
    draftData.musicId = musicUploadResult.public_id;
  }

  delete draftData.imageId;
  delete draftData.draftId;

  if (draftData.tags) draftData.tags = JSON.parse(draftData.tags);

  const draft = await Draft.create(draftData);

  if (!draft) {
    return next(new ApiError(500, 'Failed to save the draft!'));
  }

  const updatedUser = await User.findByIdAndUpdate(
    verifiedUser._id,
    {
      $addToSet: { drafts: draft._id },
    },
    { new: true }
  );

  if (!updatedUser || !updatedUser.drafts.some(id => id.equals(draft._id))) {
    return next(new ApiError(500, 'Failed to save the draft!'));
  }

  res.status(201).json(new ApiResponse({ draft }, 'You have successfully created a draft.'));
});

// *************************************************************
// EDIT DRAFT
// *************************************************************

export const editDraft = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(400, 'Empty Request Body: Please provide character details in the request body!')
    );
  }

  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { data, error } = createDraftSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const draftData: DraftData = data;

  if (!draftData.draftId) {
    return next(new ApiError(400, 'No draft id was provided!'));
  }

  const draft = await Draft.findById(draftData.draftId).select('+avatarId +musicId');

  if (!draft) {
    return next(new ApiError(404, 'The draft does no longer exist!'));
  }

  if (verifiedUser.role === 'user' && !verifiedUser._id.equals(draft.creator)) {
    return next(new ApiError(400, 'You are not allowed to edit drafts not owned by you!'));
  }

  const uploadedFiles = req.files;

  if (!uploadedFiles && Object.values(draftData).length === 0) {
    return next(new ApiError(400, 'No fields were provided!'));
  }

  let characterImage: ImageDocument | null = null;
  if (draftData.imageId) {
    characterImage = await Image.findById(draftData.imageId);

    if (!characterImage) {
      return next(new ApiError(404, 'Image does not exist! Please choose another one.'));
    }

    if (characterImage.usedByCharacter) {
      return next(
        new ApiError(
          400,
          `This image is being already used by one of your character! Please use another image.`
        )
      );
    }
  }

  let characterImagePath: string | null = null;
  let avatarImagePath: string | null = null;
  let musicImagePath: string | null = null;

  if (uploadedFiles) {
    if (
      !draftData.imageId &&
      uploadedFiles.characterImage &&
      uploadedFiles.characterImage.length !== 0
    ) {
      characterImagePath = uploadedFiles.characterImage[0].path;
    }

    if (uploadedFiles.characterAvatar && uploadedFiles.characterAvatar[0].path) {
      avatarImagePath = uploadedFiles.characterAvatar[0].path;
    }

    if (uploadedFiles.music && uploadedFiles.music[0].path) {
      musicImagePath = uploadedFiles.music[0].path;
    }
  }

  let uploadedImageDocument: ImageDocument | null = null;
  let avatarUploadResult: UploadApiResponse | null = null;
  let musicUploadResult: UploadApiResponse | null = null;

  if (characterImagePath) {
    if (characterImage?.usedPrompt === 'Direct Upload' && characterImage?.imageId) {
      const imageDeleteResult = await deleteFromCloudinary(
        characterImage.imageId,
        'image',
        cloudinary
      );

      if (!imageDeleteResult || !['ok', 'not found'].includes(imageDeleteResult.result)) {
        return next(
          new ApiError(500, 'Failed to edit character image due to internal server error!')
        );
      }
    }

    const imageUploadResult = await uploadToCloudinary(characterImagePath, 'images', {
      cloudinary,
      deleteTempFile: true,
    });

    if (!imageUploadResult) {
      return next(new ApiError(500, 'Failed to upload character image!'));
    }

    uploadedImageDocument = await Image.create({
      image: imageUploadResult.secure_url,
      imageId: imageUploadResult.public_id,
      user: verifiedUser._id,
      usedPrompt: 'Direct Upload',
    });

    if (!uploadedImageDocument) {
      return next(new ApiError(500, 'Failed to upload character image!'));
    }
  }

  if (avatarImagePath) {
    if (draft.avatarId) {
      const avatarDeleteResult = await deleteFromCloudinary(draft.avatarId, 'image', cloudinary);

      if (!avatarDeleteResult || !['ok', 'not found'].includes(avatarDeleteResult.result)) {
        return next(
          new ApiError(500, 'Failed to edit character image due to internal server error!')
        );
      }
    }

    avatarUploadResult = await uploadToCloudinary(avatarImagePath, 'images', {
      cloudinary,
      deleteTempFile: true,
    });

    if (!avatarUploadResult) {
      return next(new ApiError(500, 'Failed to upload avatar image!'));
    }
  }

  if (musicImagePath) {
    if (draft.musicId) {
      const musicDeleteResult = await deleteFromCloudinary(draft.musicId, 'video', cloudinary);

      if (!musicDeleteResult || !['ok', 'not found'].includes(musicDeleteResult.result)) {
        return next(
          new ApiError(500, 'Failed to edit character image due to internal server error!')
        );
      }
    }

    musicUploadResult = await uploadToCloudinary(musicImagePath, 'musics', {
      cloudinary,
      deleteTempFile: true,
    });

    if (!musicUploadResult) {
      return next(new ApiError(500, 'Failed to upload the music!'));
    }
  }

  if (draftData.imageId || uploadedImageDocument) {
    draftData.characterImage = draftData.imageId || uploadedImageDocument?._id.toString();
  }

  if (avatarUploadResult) {
    draftData.characterAvatar = avatarUploadResult.secure_url;
    draftData.avatarId = avatarUploadResult.public_id;
  }

  if (musicUploadResult) {
    draftData.music = musicUploadResult.secure_url;
    draftData.musicId = musicUploadResult.public_id;
  }

  delete draftData.imageId;
  delete draftData.draftId;

  if (draftData.tags) draftData.tags = JSON.parse(draftData.tags);

  const result = await runInTransaction(async session => {
    const updatedDraft = await Draft.findByIdAndUpdate(
      draft._id,
      { $set: draftData },
      {
        new: true,
        session,
      }
    );

    if (!updatedDraft) {
      throw new Error('Failed to update character document!');
    }

    if (uploadedImageDocument) {
      const imageDoc = await Image.findById(draft.characterImage).session(session);

      if (!imageDoc) throw new Error('Failed to load image document!');

      if (imageDoc.usedPrompt === 'Direct Upload') {
        const deletedDoc = await Image.findByIdAndDelete(draft.characterImage, { session });

        if (!deletedDoc) {
          throw new Error('Failed to delete image document!');
        }
      }
    }
  });

  if (result === 'error') {
    return next(new ApiError(500, 'Failed to save changes!'));
  }

  res.status(200).json(new ApiResponse(null, 'Changes saved successfully.'));
});

// *************************************************************
// PUBLISH DRAFT
// *************************************************************

export const publishDraft = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { draftId } = req.params;

  const draft = await Draft.findById(draftId).select('+avatarId +musicId').lean();

  if (!draft) {
    return next(new ApiError(404, 'Draft does no longer exist!'));
  }

  if (verifiedUser.role === 'user' && !verifiedUser._id.equals(draft.creator)) {
    return next(new ApiError(400, 'You are not allowed publish a draft not owned by you!'));
  }

  if (!draft.characterImage) {
    return next(new ApiError(400, 'Please choose a character image!'));
  }

  const image = await Image.findById(draft.characterImage).populate<{
    usedByCharacter: CharacterDocument;
  }>('usedByCharacter', 'name');

  if (!image) {
    return next(new ApiError(404, 'Image does not exist! Please choose another one.'));
  }

  if (image.usedByCharacter) {
    return next(
      new ApiError(
        400,
        `This image is being already used by your character ${image.usedByCharacter.name}! Please use another image.`
      )
    );
  }

  if (draft.tags) draft.tags = JSON.stringify(draft.tags) as any;

  const { data, error } = createCharacterSchema.safeParse(draft);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const characterData: CharacterData = data;

  const [isSafeName, isSafeDescription, isSafePersonalty, isSafeOpening] = await Promise.all([
    contentModerator(characterData.name),
    contentModerator(characterData.description),
    contentModerator(characterData.personality),
    contentModerator(characterData.opening),
  ]);

  if (!isSafeName) {
    return next(new ApiError(400, 'Name contains inappropriate content!'));
  }

  if (!isSafeDescription) {
    return next(new ApiError(400, 'Description contains inappropriate content!'));
  }

  if (!isSafePersonalty) {
    return next(new ApiError(400, 'Personality contains inappropriate content!'));
  }

  if (!isSafeOpening) {
    return next(new ApiError(400, 'Opening contains inappropriate content!'));
  }

  characterData.creator = draft.creator.toString();

  characterData.isApproved = true;

  characterData.characterImage = draft.characterImage.toString();

  if (draft.music) {
    characterData.music = draft.music;
    characterData.musicId = draft.musicId;
  }

  if (draft.characterAvatar) {
    characterData.characterAvatar = draft.characterAvatar;
    characterData.avatarId = draft.avatarId;
  }

  if (characterData.tags) characterData.tags = JSON.parse(characterData.tags);

  const character = await Character.create(characterData);

  if (!character) {
    return next(new ApiError(500, 'Failed to publish the character'));
  }

  const [updatedUser, updatedImage, _] = await Promise.all([
    User.findByIdAndUpdate(
      character.creator,
      {
        $addToSet: { creations: character._id },
        $inc: { creationCount: 1 },
      },
      { new: true }
    ),
    Image.findByIdAndUpdate(
      character.characterImage,
      {
        $set: { usedByCharacter: character._id },
      },
      { new: true }
    ),
    createNotification('new', character.creator),
  ]);

  if (
    !updatedUser ||
    !updatedUser.creations.some(id => id.equals(character._id)) ||
    !updatedImage ||
    !updatedImage.usedByCharacter.equals(character._id)
  ) {
    return next(new ApiError(500, 'Failed to update user creations!'));
  }

  const deletedDraft = await Draft.findByIdAndDelete(draftId);

  if (deletedDraft) {
    await User.findByIdAndUpdate(
      character.creator,
      {
        $pull: { drafts: draftId },
      },
      { new: true }
    );
  }

  res.status(201).json(new ApiResponse({ character }, 'Character published successfully.'));
});

// *************************************************************
// DELETE DRAFT
// *************************************************************

export const deleteDraft = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { draftId } = req.params;

  const draft = await Draft.findById(draftId).select('+avatarId +musicId');

  if (!draft) {
    return next(new ApiError(404, 'Draft does no longer exist!'));
  }

  if (verifiedUser.role === 'user' && !verifiedUser._id.equals(draft.creator)) {
    return next(new ApiError(400, 'You are not allowed delete a draft not owned by you!'));
  }

  const characterImage = await Image.findById(draft.characterImage).select('+imageId');

  if (!characterImage) {
    return next(new ApiError(404, 'Failed to delete character image!'));
  }

  if (characterImage.usedPrompt === 'Direct Upload') {
    const imageDeleteResult = await deleteFromCloudinary(
      characterImage.imageId,
      'image',
      cloudinary
    );

    if (!imageDeleteResult || !['ok', 'not found'].includes(imageDeleteResult.result)) {
      return next(
        new ApiError(500, 'Failed to delete character image due to internal server error!')
      );
    }
  }

  if (draft.avatarId) {
    const avatarDeleteResult = await deleteFromCloudinary(draft.avatarId, 'image', cloudinary);

    if (!avatarDeleteResult || !['ok', 'not found'].includes(avatarDeleteResult.result)) {
      return next(new ApiError(500, 'Failed to delete avatar due to internal server error!'));
    }
  }

  if (draft.musicId) {
    const musicDeleteResult = await deleteFromCloudinary(draft.musicId, 'video', cloudinary);

    if (!musicDeleteResult || !['ok', 'not found'].includes(musicDeleteResult.result)) {
      return next(new ApiError(500, 'Failed to delete music due to internal server error!'));
    }
  }

  const result = await runInTransaction(async session => {
    const deletedDraft = await Character.findByIdAndDelete(draft._id, { session });

    if (characterImage.usedPrompt === 'Direct Upload') {
      const deletedImageDocument = await Image.findByIdAndDelete(characterImage._id, { session });

      if (!deletedImageDocument) {
        throw new Error('Failed to delete documents!');
      }
    }

    const updatedCreator = await User.findByIdAndUpdate(
      draft.creator,
      {
        $pull: {
          drafts: draft._id,
        },
      },
      { new: true, session }
    );

    if (
      !deletedDraft ||
      !updatedCreator ||
      updatedCreator.drafts.some(id => id.equals(draft._id))
    ) {
      throw new Error('Failed to delete documents!');
    }
  });

  if (result === 'error') {
    return next(new ApiError(500, 'Failed to delete due to internal server error!'));
  }

  res.status(200).json(new ApiResponse(null, 'Draft deleted successfully.'));
});

// *************************************************************
// DELETE DRAFT MEDIA
// *************************************************************

export const deleteDraftMedia = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const { data, error } = removeMediaSchema.safeParse(req.query);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { draftId, target } = data;

  if (!draftId) {
    return next(new ApiError(400, 'Draft id is required!'));
  }

  const draft = await Draft.findById(draftId).select('+avatarId +musicId');

  if (!draft) {
    return next(new ApiError(404, 'Draft does not exist!'));
  }

  if (verifiedUser.role === 'user' && !verifiedUser._id.equals(draft.creator)) {
    return next(
      new ApiError(400, 'You are not allowed to delete media of drafts not owned by you!')
    );
  }

  if (target === 'avatar') {
    if (!draft.avatarId) {
      return next(new ApiError(400, 'You have no avatar image to remove!'));
    }

    const deleteResult = await deleteFromCloudinary(draft.avatarId, 'image', cloudinary);

    if (!deleteResult || !['ok', 'not found'].includes(deleteResult.result)) {
      return next(new ApiError(500, 'Failed to delete avatar image!'));
    }

    const updatedDraft = await Draft.findByIdAndUpdate(
      draft._id,
      {
        $set: { characterAvatar: '', avatarId: '' },
      },
      { new: true }
    );

    if (!updatedDraft || updatedDraft.characterAvatar || updatedDraft.avatarId) {
      return next(new ApiError(500, 'Failed to remove draft avatar due to internal server error!'));
    }
  }

  if (target === 'music') {
    if (!draft.musicId) {
      return next(new ApiError(400, 'You have no music to remove!'));
    }

    const deleteResult = await deleteFromCloudinary(draft.musicId, 'video', cloudinary);

    if (!deleteResult || !['ok', 'not found'].includes(deleteResult.result)) {
      return next(new ApiError(500, 'Failed to delete the draft music!'));
    }

    const updatedDraft = await Draft.findByIdAndUpdate(
      draft._id,
      {
        $set: { music: '', musicId: '' },
      },
      { new: true }
    );

    if (!updatedDraft || updatedDraft.music || updatedDraft.musicId) {
      return next(new ApiError(500, 'Failed to remove draft music due to internal server error!'));
    }
  }

  res.status(200).json(new ApiResponse(null, `You have successfully removed ${target}.`));
});
