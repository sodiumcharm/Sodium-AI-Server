import { Response, NextFunction } from 'express';
import { UploadApiResponse } from 'cloudinary';
import asyncHandler from '../../utils/asyncHandler';
import {
  AuthRequest,
  CharacterData,
  ChatData,
  ImageDocument,
  MemoryDocument,
  MessageDocument,
} from '../../types/types';
import ApiError from '../../utils/apiError';
import ApiResponse from '../../utils/apiResponse';
import User from '../../models/user.model';
import Character from '../../models/character.model';
import { uploadToCloudinary, deleteFromCloudinary } from '../../services/cloudinary';
import contentModerator from '../../moderator/contentModerator';
import createNotification from '../../notification/notification';
import {
  characterCommunicationSchema,
  createCharacterSchema,
} from '../../validators/character.validators';
import Image from '../../models/image.model';
import Memory from '../../models/memory.model';
import { communicate } from './character.utils';
import { MODEL_MEMORY } from '../../constants';
import { runInTransaction } from '../../services/mongoose';

// *************************************************************
// CREATE CHARACTER
// *************************************************************

export const createCharacter = asyncHandler(async function (
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

  const { data, error } = createCharacterSchema.safeParse(req.body);

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

  const uploadedFiles = req.files;

  if (!uploadedFiles) {
    return next(new ApiError(400, 'No files were uploaded!'));
  }

  let characterImagePath: string | null = null;
  if (!characterData.imageId) {
    if (!uploadedFiles.characterImage || uploadedFiles.characterImage.length === 0) {
      return next(new ApiError(400, 'Character image is required!'));
    }

    characterImagePath = uploadedFiles.characterImage[0].path;
  } else {
    const image = await Image.findById(characterData.imageId);
    if (!image) {
      return next(new ApiError(404, 'Image does not exist! Please choose another one.'));
    }
  }

  let characterAvatarPath: string | null = null;
  if (uploadedFiles.characterAvatar && uploadedFiles.characterAvatar.length !== 0) {
    characterAvatarPath = uploadedFiles.characterAvatar[0].path;
  }

  let musicPath: string | null = null;
  if (uploadedFiles.music && uploadedFiles.music.length !== 0) {
    musicPath = uploadedFiles.music[0].path;
  }

  let image: ImageDocument | null = null;
  let characterImageUploadResult: UploadApiResponse | null = null;
  if (characterImagePath) {
    characterImageUploadResult = await uploadToCloudinary(characterImagePath, 'images');

    if (!characterImageUploadResult) {
      return next(new ApiError(500, 'Failed to upload character image!'));
    }

    image = await Image.create({
      image: characterImageUploadResult.secure_url,
      imageId: characterImageUploadResult.public_id,
      usedPrompt: 'Direct Upload',
    });

    if (!image) {
      return next(new ApiError(500, 'Failed to register image!'));
    }
  }

  let characterAvatarUploadResult: UploadApiResponse | null = null;
  if (characterAvatarPath) {
    characterAvatarUploadResult = await uploadToCloudinary(characterAvatarPath, 'images');

    if (!characterAvatarUploadResult) {
      return next(new ApiError(500, 'Failed to upload character avatar!'));
    }
  }

  let musicUploadResult: UploadApiResponse | null = null;
  if (musicPath) {
    musicUploadResult = await uploadToCloudinary(musicPath, 'musics');

    if (!musicUploadResult) {
      return next(new ApiError(500, 'Failed to upload the background music!'));
    }
  }

  characterData.characterImage = characterData.imageId || image?._id.toString();

  delete characterData.imageId;

  characterData.creator = verifiedUser._id.toString();
  characterData.characterAvatar = characterAvatarUploadResult?.secure_url || '';
  characterData.avatarId = characterAvatarUploadResult?.public_id || '';
  characterData.music = musicUploadResult?.secure_url || '';
  characterData.musicId = musicUploadResult?.public_id || '';
  characterData.isApproved = true;

  const character = await Character.create(characterData);

  if (!character) {
    return next(new ApiError(500, 'Failed to create character!'));
  }

  const [updated, _] = await Promise.all([
    User.findByIdAndUpdate(
      verifiedUser._id,
      {
        $addToSet: { creations: character._id },
        $inc: { creationCount: 1 },
      },
      { new: true }
    ),
    createNotification('new', verifiedUser._id),
  ]);

  if (!updated || !updated.creations.some(id => id.equals(character._id))) {
    return next(new ApiError(500, 'Failed to update user creations!'));
  }

  res.status(201).json(new ApiResponse({ character }, 'Character created successfully.'));
});

// *************************************************************
// COMMUNICATE CHARACTER
// *************************************************************

export const communicateCharacter = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(
        400,
        'Empty Request Body: Please provide characterId and text in the request body!'
      )
    );
  }

  const verifiedUser = req.user;

  const { data, error } = characterCommunicationSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { characterId, text } = data;

  const character = await Character.findById(characterId);

  if (!character || !character.isApproved) {
    return next(new ApiError(404, 'Character does not exist or is not approved!'));
  }

  if (
    (!verifiedUser && character.llmModel.startsWith('gpt')) ||
    (verifiedUser &&
      verifiedUser.role === 'user' &&
      !verifiedUser.isPaid &&
      character.llmModel.startsWith('gpt'))
  ) {
    return next(new ApiError(400, 'Paid subscription required to use GPT models!'));
  }

  let chatHistory: MemoryDocument | null = null;

  if (verifiedUser) {
    chatHistory = await Memory.findOne(
      { character: characterId, user: verifiedUser._id },
      { messages: { $slice: -MODEL_MEMORY[character.llmModel] } }
    );

    if (!chatHistory) {
      const openingChat: MessageDocument = {
        sender: 'you',
        content: character.opening,
        timestamp: new Date(),
      };

      chatHistory = await Memory.create({
        character: character._id,
        user: verifiedUser._id,
        messages: [openingChat],
      });

      if (
        !character.communicators.some(id => id.equals(verifiedUser._id)) &&
        !verifiedUser.communications.some(id => id.equals(character._id))
      ) {
        const result = await runInTransaction(async session => {
          const characterUpdated = await Character.findByIdAndUpdate(
            characterId,
            {
              $addToSet: { communicators: verifiedUser._id },
              $inc: { communicatorCount: 1 },
            },
            { new: true, session }
          );

          const userUpdated = await User.findByIdAndUpdate(
            verifiedUser._id,
            {
              $addToSet: { communications: character._id },
            },
            { new: true, session }
          );

          if (
            !characterUpdated ||
            !characterUpdated.communicators.some(id => id.equals(verifiedUser._id)) ||
            !userUpdated ||
            !userUpdated.communications.some(id => id.equals(character._id))
          ) {
            throw new Error('Failed to update character or user!');
          }
        });

        if (result === 'error') {
          return next(new ApiError(500, 'Error during registering communication!'));
        }

        if (!character.creator.equals(verifiedUser._id)) {
          await createNotification('communicate', verifiedUser._id, {
            receiverUser: character.creator,
            receiverCharacter: character._id,
          });
        }
      }
    }
  }

  const chatData: ChatData = {
    text,
    llmModel: character.llmModel,
    characterName: character.name,
    gender: character.gender,
    personality: character.personality,
    responseStyle: character.responseStyle,
  };

  if (chatHistory && chatHistory.messages.length !== 0) {
    chatData.chatHistory = chatHistory.messages;
  } else {
    chatData.opening = character.opening;
  }

  if (character.mbti) {
    chatData.mbti = character.mbti;
  }

  if (character.enneagram) {
    chatData.enneagram = character.enneagram;
  }

  if (character.attachmentStyle) {
    chatData.attachmentStyle = character.attachmentStyle;
  }

  if (character.zodiac) {
    chatData.zodiac = character.zodiac;
  }

  const response = await communicate(chatData);

  if (response === 'quota-exceeded') {
    return next(new ApiError(429, 'Quota exceeded! Please try again later.'));
  }

  if (response === 'error') {
    return next(new ApiError(500, 'Failed to communicate with character!'));
  }

  res
    .status(200)
    .json(new ApiResponse({ reply: response }, 'Character communicated successfully.'));

  const userResponse = {
    sender: 'user',
    content: text,
    timestamp: new Date(),
  };

  const characterResponse = {
    sender: 'you',
    content: response,
    timestamp: new Date(),
  };

  if (verifiedUser && chatHistory) {
    await Memory.findByIdAndUpdate(chatHistory._id, {
      $push: {
        messages: {
          $each: [userResponse, characterResponse],
          $slice: -50,
        },
      },
    });
  }
});

// *************************************************************
// FOLLOW CHARACTER
// *************************************************************

export const followCharacter = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const { characterId } = req.params;

  const character = await Character.findById(characterId);

  if (!character) {
    return next(new ApiError(404, 'Character does not exist!'));
  }

  if (!character.isApproved) {
    return next(new ApiError(400, 'Character is flagged as unsafe!'));
  }

  if (character.creator.equals(verifiedUser._id)) {
    return next(new ApiError(400, 'You are not allowed to follow your own character!'));
  }

  let isFollowed: boolean;

  if (
    character.followers.some(id => id.equals(verifiedUser._id)) &&
    verifiedUser.followingCharacters.some(id => id.equals(character._id))
  ) {
    isFollowed = false;

    const result = await runInTransaction(async session => {
      const characterUpdated = await Character.findByIdAndUpdate(
        characterId,
        {
          $pull: { followers: verifiedUser._id },
          $inc: { followerCount: -1 },
        },
        { new: true, session }
      );

      const userUpdated = await User.findByIdAndUpdate(
        verifiedUser._id,
        {
          $pull: { followingCharacters: character._id },
        },
        { new: true, session }
      );

      const creatorUpdated = await User.findByIdAndUpdate(
        character.creator,
        {
          $inc: { totalFollowers: -1 },
        },
        { new: true, session }
      );

      if (
        !characterUpdated ||
        characterUpdated.followers.some(id => id.equals(verifiedUser._id)) ||
        !userUpdated ||
        userUpdated.followingCharacters.some(id => id.equals(character._id)) ||
        !creatorUpdated ||
        creatorUpdated.totalFollowers < 0
      ) {
        throw new Error('Failed to update character or users!');
      }
    });

    if (result === 'error') {
      return next(new ApiError(500, 'Error during unfollowing character!'));
    }
  } else {
    isFollowed = true;

    const result = await runInTransaction(async session => {
      const characterUpdated = await Character.findByIdAndUpdate(
        characterId,
        {
          $addToSet: { followers: verifiedUser._id },
          $inc: { followerCount: 1 },
        },
        { new: true, session }
      );

      const userUpdated = await User.findByIdAndUpdate(
        verifiedUser._id,
        {
          $addToSet: { followingCharacters: character._id },
        },
        { new: true, session }
      );

      const creatorUpdated = await User.findByIdAndUpdate(
        character.creator,
        {
          $inc: { totalFollowers: 1 },
        },
        { new: true, session }
      );

      if (
        !characterUpdated ||
        !characterUpdated.followers.some(id => id.equals(verifiedUser._id)) ||
        !userUpdated ||
        !userUpdated.followingCharacters.some(id => id.equals(character._id)) ||
        !creatorUpdated ||
        creatorUpdated.totalFollowers < 0
      ) {
        throw new Error('Failed to update character or users!');
      }
    });

    if (result === 'error') {
      return next(new ApiError(500, 'Error during following character!'));
    }

    await createNotification('follow', verifiedUser._id, {
      receiverUser: character.creator,
      receiverCharacter: character._id,
    });
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        { isFollowed },
        isFollowed ? 'Character followed successfully.' : 'Character unfollowed successfully.'
      )
    );
});

// *************************************************************
// DELETE COMMUNICATION HISTORY
// *************************************************************

export const clearCommunicationMemory = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return res
      .status(200)
      .json(new ApiResponse(null, 'Request accepted although you are not logged in.'));
  }

  const { characterId } = req.params;

  const character = await Character.findById(characterId);

  if (!character) {
    return next(new ApiError(404, 'Character does not exist!'));
  }

  const openingChat: MessageDocument = {
    sender: 'you',
    content: character.opening,
    timestamp: new Date(),
  };

  const clearedMemory = await Memory.findOneAndUpdate(
    { character: characterId, user: verifiedUser._id },
    { $set: { messages: [openingChat] } },
    { new: true }
  );

  if (!clearedMemory || clearedMemory.messages.length !== 1) {
    return next(new ApiError(500, 'Failed to clear communication history!'));
  }

  res.status(200).json(new ApiResponse(null, 'Communication memory cleared successfully.'));
});

// *************************************************************
// DELETE CHARACTER
// *************************************************************

export const dropCharacter = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const { characterId } = req.params;

  const character = await Character.findById(characterId);

  if (!character) {
    return next(new ApiError(404, 'Character does not exist!'));
  }

  if (verifiedUser.role === 'user' && !verifiedUser.id.equals(character.creator)) {
    return next(new ApiError(400, 'You are not allowed to delete characters not owned by you!'));
  }

  const characterImage = await Image.findById(character.characterImage);

  if (!characterImage) {
    return next(new ApiError(404, 'Failed to delete character image!'));
  }

  if (characterImage.usedPrompt === 'Direct Upload') {
    const imageDeleteResult = await deleteFromCloudinary(characterImage.imageId, 'image');

    if (!imageDeleteResult || !['ok', 'not found'].includes(imageDeleteResult.result)) {
      return next(
        new ApiError(500, 'Failed to delete character image due to internal server error!')
      );
    }
  }

  if (character.avatarId) {
    const avatarDeleteResult = await deleteFromCloudinary(character.avatarId, 'image');

    if (!avatarDeleteResult || !['ok', 'not found'].includes(avatarDeleteResult.result)) {
      return next(new ApiError(500, 'Failed to delete avatar due to internal server error!'));
    }
  }

  if (character.musicId) {
    const musicDeleteResult = await deleteFromCloudinary(character.musicId, 'video');

    if (!musicDeleteResult || !['ok', 'not found'].includes(musicDeleteResult.result)) {
      return next(new ApiError(500, 'Failed to delete music due to internal server error!'));
    }
  }

  const result = await runInTransaction(async session => {
    const deletedCharacterDocument = await Character.findByIdAndDelete(character._id, { session });

    if (characterImage.usedPrompt === 'Direct Upload') {
      const deletedImageDocument = await Image.findByIdAndDelete(characterImage._id, { session });

      if (!deletedImageDocument) {
        throw new Error('Failed to delete documents!');
      }
    }

    const erasedMemories = await Memory.deleteMany({ character: character._id }, { session });

    const updatedUsers = await User.updateMany(
      {
        $or: [{ followingCharacters: character._id }, { communications: character._id }],
      },
      {
        $pull: {
          followingCharacters: character._id,
          communications: character._id,
        },
      },
      { session }
    );

    const updatedCreator = await User.findByIdAndUpdate(
      character.creator,
      {
        $pull: {
          creations: character._id,
        },
        $inc: {
          creationCount: -1,
          totalFollowers: -character.followerCount,
        },
      },
      { new: true, session }
    );

    if (
      !deletedCharacterDocument ||
      !erasedMemories ||
      !updatedUsers ||
      !updatedCreator ||
      updatedCreator.creations.some(id => id.equals(character._id))
    ) {
      throw new Error('Failed to delete documents!');
    }
  });

  if (result === 'error') {
    return next(new ApiError(500, 'Failed to delete due to internal server error!'));
  }

  res.status(200).json(new ApiResponse(null, 'Character deleted successfully.'));
});
