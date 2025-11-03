import { Response, NextFunction } from 'express';
import { UploadApiResponse } from 'cloudinary';
import asyncHandler from '../../utils/asyncHandler';
import {
  AuthRequest,
  CharacterData,
  CharacterDocument,
  CharacterEditData,
  CharacterReportDocument,
  ChatData,
  ImageDocument,
  MemoryDocument,
  MessageDocument,
  ReportReasons,
  UserDocument,
} from '../../types/types';
import ApiError from '../../utils/apiError';
import ApiResponse from '../../utils/apiResponse';
import User from '../../models/user.model';
import Character from '../../models/character.model';
import { cloudinary, uploadToCloudinary, deleteFromCloudinary } from '../../services/cloudinary';
import contentModerator from '../../moderator/contentModerator';
import createNotification from '../../notification/notification';
import {
  characterCommunicationSchema,
  characterReportSchema,
  createCharacterSchema,
  editCharacterSchema,
  getCharactersOptionSchema,
  getUserCreationsSchema,
  reminderSchema,
  removeMediaSchema,
  searchCharactersSchema,
} from '../../validators/character.validators';
import Image from '../../models/image.model';
import Memory from '../../models/memory.model';
import { communicate, getReplyAdvices, updateContextMemory } from './character.utils';
import {
  CHARACTER_DISABLE_THRESHOLD,
  CHARACTER_DISAPPROVAL_THRESHOLD,
  MODEL_MEMORY,
} from '../../constants';
import { runInTransaction } from '../../services/mongoose';
import { numericStringSchema, objectIdSchema } from '../../validators/general.validators';
import genAI from '../../llm/gemini/gemini';
import openAI from '../../llm/openAI/openAI';
import agenda from '../../jobs/agenda';
import CharacterReport from '../../models/characterReport.model';
import generateCharacterReportEmail from '../../templates/report.mail';
import sendMail from '../../config/nodemailer';

// *************************************************************
// SEARCH CHARACTERS
// *************************************************************

export const searchCharacters = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.query) {
    return next(new ApiError(400, 'Empty Request Query: Please provide search fields!'));
  }

  const { data, error } = searchCharactersSchema.safeParse(req.query);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { query, page } = data;

  const limit = 20;
  const skip = (page - 1) * limit;

  const filter = {
    $text: { $search: query },
    visibility: 'public',
  };

  let [results, totalCount] = await Promise.all([
    Character.find(filter)
      .select('name avatarImage characterImage creator')
      .populate([
        { path: 'characterImage', select: 'image' },
        { path: 'creator', select: 'fullname profileImage' },
      ])
      .skip(skip)
      .limit(limit),
    Character.countDocuments(filter),
  ]);

  if (!results) {
    return next(new ApiError(500, 'Error while searching characters!'));
  }

  if (results.length === 0) {
    const fallbackFilter = {
      name: { $regex: query, $options: 'i' },
      visibility: 'public',
    };

    [results, totalCount] = await Promise.all([
      Character.find(fallbackFilter)
        .select('name avatarImage characterImage creator')
        .populate([
          { path: 'characterImage', select: 'image' },
          { path: 'creator', select: 'fullname profileImage' },
        ])
        .skip(skip)
        .limit(limit),
      Character.countDocuments(fallbackFilter),
    ]);

    if (!results) {
      return next(new ApiError(500, 'Error while searching characters!'));
    }
  }

  res.status(200).json(
    new ApiResponse({
      characters: results,
      currentPage: page,
      totalCount: totalCount ?? null,
      hasMore: skip + results.length < totalCount,
    })
  );
});

// *************************************************************
// GET CHARACTERS
// *************************************************************

export const getCharacters = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  const { option, page } = req.query;

  const { data: incomingOption, error } = getCharactersOptionSchema.safeParse(option);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  let result: CharacterDocument[] | null = null;
  let totalCount: number = 0;
  const selectionFields = 'name characterImage avatarImage communicatorCount creator';
  const verifiedUserFields = 'name characterImage avatarImage communicatorCount description';

  if (incomingOption === 'random') {
    const aggregateData = await Character.aggregate([
      { $match: { isApproved: true, active: true, visibility: 'public' } },
      { $sample: { size: 15 } },
      {
        $project: {
          isApproved: 0,
          active: 0,
          followers: 0,
          communicators: 0,
          comments: 0,
          relationship: 0,
          responseStyle: 0,
          personality: 0,
          reports: 0,
        },
      },
    ]);

    if (!aggregateData) {
      return next(new ApiError(500, 'Failed to load characters!'));
    }

    result = await Character.populate(aggregateData, [
      { path: 'creator', select: 'fullname profileImage' },
      { path: 'characterImage', select: 'image' },
    ]);
  }

  if (incomingOption !== 'random') {
    const { data: currentPage, error: pageError } = numericStringSchema.safeParse(page);

    if (pageError) {
      return next(new ApiError(400, pageError.issues[0].message));
    }

    const limit = 20;
    const skip = (currentPage - 1) * limit;

    const generalQuery = { isApproved: true, active: true, visibility: 'public' };
    const tagQuery = { ...generalQuery, tags: incomingOption };

    if (incomingOption === 'all') {
      [result, totalCount] = await Promise.all([
        Character.find(generalQuery).skip(skip).limit(limit).select(selectionFields),
        Character.countDocuments(generalQuery),
      ]);
    } else if (incomingOption === 'recent') {
      [result, totalCount] = await Promise.all([
        Character.find(generalQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select(selectionFields),
        Character.countDocuments(generalQuery),
      ]);
    } else if (incomingOption === 'most-followed') {
      [result, totalCount] = await Promise.all([
        Character.find(generalQuery)
          .sort({ followerCount: -1 })
          .skip(skip)
          .limit(limit)
          .select(selectionFields),
        Character.countDocuments(generalQuery),
      ]);
    } else {
      [result, totalCount] = await Promise.all([
        Character.find(tagQuery).skip(skip).limit(limit).select(selectionFields),
        Character.countDocuments(tagQuery),
      ]);
    }

    if (incomingOption.startsWith('my-')) {
      if (!verifiedUser) {
        return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
      }

      if (incomingOption === 'my-creations') {
        const populatedUser = await User.findById(verifiedUser._id)
          .select({ creations: { $slice: [skip, limit] } })
          .populate<{
            creations: CharacterDocument[];
          }>('creations', verifiedUserFields);

        if (!populatedUser) {
          return next(new ApiError(500, 'Error while loading your creations!'));
        }

        result = populatedUser.creations;
      }

      if (incomingOption === 'my-followings') {
        const populatedUser = await User.findById(verifiedUser._id)
          .select({ followingCharacters: { $slice: [skip, limit] } })
          .populate<{
            followingCharacters: CharacterDocument[];
          }>('followingCharacters', selectionFields);

        if (!populatedUser) {
          return next(new ApiError(500, 'Error while loading your following characters!'));
        }

        result = populatedUser.followingCharacters;
      }

      if (incomingOption === 'my-communications') {
        const populatedUser = await User.findById(verifiedUser._id)
          .select({ communications: { $slice: [skip, limit] } })
          .populate<{
            communications: CharacterDocument[];
          }>('communications', selectionFields);

        if (!populatedUser) {
          return next(new ApiError(500, 'Error while loading your communications!'));
        }

        result = populatedUser.communications;
      }

      if (incomingOption === 'my-failbox') {
        [result, totalCount] = await Promise.all([
          Character.find({ creator: verifiedUser._id, isApproved: false })
            .skip(skip)
            .limit(limit)
            .select(verifiedUserFields),
          Character.countDocuments({ creator: verifiedUser._id, isApproved: false }),
        ]);
      }
    }

    if (!result) {
      return next(new ApiError(500, 'Failed to load characters!'));
    }

    result = await Character.populate(result, [
      { path: 'characterImage', select: 'image' },
      { path: 'creator', select: 'fullname profileImage' },
    ]);

    if (!result) {
      return next(new ApiError(500, 'Failed to load characters!'));
    }

    return res.status(200).json(
      new ApiResponse({
        characters: result,
        currentPage,
        totalCount: totalCount ?? null,
        hasMore: skip + result.length < totalCount,
      })
    );
  }

  if (!result) {
    return next(new ApiError(500, 'Failed to load characters!'));
  }

  res.status(200).json(new ApiResponse({ characters: result }));
});

// *************************************************************
// GET CHARACTER INFO
// *************************************************************

export const getCharacterInfo = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  const { characterId } = req.params;

  const character = await Character.findById(characterId);

  if (!character) {
    return next(new ApiError(404, 'Character does not exist!'));
  }

  let characterInfo: CharacterDocument | null = null;

  if (
    !verifiedUser ||
    (verifiedUser.role === 'user' && !verifiedUser._id.equals(character.creator))
  ) {
    characterInfo = await Character.findById(characterId).select(
      '-followers -communicators -isApproved -active -relationship -responseStyle -personality -visibility'
    );
  } else {
    characterInfo = await Character.findById(characterId).select(
      '-followers -communicators -isApproved -active'
    );
  }

  if (!characterInfo) {
    return next(new ApiError(500, 'Failed to load the character info!'));
  }

  res.status(200).json(new ApiResponse({ character: characterInfo }));
});

// *************************************************************
// LOAD OTHER USER CREATIONS
// *************************************************************

export const getUserCreations = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const { data, error } = getUserCreationsSchema.safeParse(req.query);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { userId, page } = data;

  const user = await User.findById(userId);

  if (!user) {
    return next(new ApiError(404, 'User does not exist!'));
  }

  const limit = 20;
  const skip = (page - 1) * limit;

  const [characters, totalCount] = await Promise.all([
    Character.find({
      creator: userId,
      isApproved: true,
      visibility: 'public',
    })
      .select('name characterImage characterAvatar communicatorCount creator')
      .skip(skip)
      .limit(limit),
    Character.countDocuments({
      creator: userId,
      isApproved: true,
      visibility: 'public',
    }),
  ]);

  if (!characters) {
    return next(new ApiError(500, 'Failed to load characters!'));
  }

  res.status(200).json(
    new ApiResponse({
      characters,
      currentPage: page,
      totalCount: totalCount ?? null,
      hasMore: skip + characters.length < totalCount,
    })
  );
});

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
    const image = await Image.findById(characterData.imageId).populate<{
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
    characterImageUploadResult = await uploadToCloudinary(characterImagePath, 'images', {
      cloudinary,
      deleteTempFile: true,
    });

    if (!characterImageUploadResult) {
      return next(new ApiError(500, 'Failed to upload character image!'));
    }

    image = await Image.create({
      image: characterImageUploadResult.secure_url,
      imageId: characterImageUploadResult.public_id,
      user: verifiedUser._id,
      usedPrompt: 'Direct Upload',
    });

    if (!image) {
      return next(new ApiError(500, 'Failed to register image!'));
    }
  }

  let characterAvatarUploadResult: UploadApiResponse | null = null;
  if (characterAvatarPath) {
    characterAvatarUploadResult = await uploadToCloudinary(characterAvatarPath, 'images', {
      cloudinary,
      deleteTempFile: true,
    });

    if (!characterAvatarUploadResult) {
      return next(new ApiError(500, 'Failed to upload character avatar!'));
    }
  }

  let musicUploadResult: UploadApiResponse | null = null;
  if (musicPath) {
    musicUploadResult = await uploadToCloudinary(musicPath, 'musics', {
      cloudinary,
      deleteTempFile: true,
    });

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
  if (characterData.tags) characterData.tags = JSON.parse(characterData.tags);

  const character = await Character.create(characterData);

  if (!character) {
    return next(new ApiError(500, 'Failed to create character!'));
  }

  const [updatedUser, updatedImage, _] = await Promise.all([
    User.findByIdAndUpdate(
      verifiedUser._id,
      {
        $addToSet: { creations: character._id },
        $inc: { creationCount: 1 },
      },
      { new: true }
    ),
    Image.findByIdAndUpdate(
      characterData.characterImage,
      {
        $set: { usedByCharacter: character._id },
      },
      { new: true }
    ),
    createNotification('new', verifiedUser._id),
  ]);

  if (
    !updatedUser ||
    !updatedUser.creations.some(id => id.equals(character._id)) ||
    !updatedImage ||
    !updatedImage.usedByCharacter.equals(character._id)
  ) {
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

  if (!character.active) {
    return next(new ApiError(400, 'Character is disabled due to violation of rules!'));
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
    chatData.memory = chatHistory.contextMemory;
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

  const response = await communicate(chatData, { genAI, openAI });

  if (response === 'quota-exceeded') {
    return next(new ApiError(429, 'Quota exceeded! Please try again later.'));
  }

  if (response === 'error') {
    return next(new ApiError(500, 'Failed to communicate with character!'));
  }

  res
    .status(200)
    .json(new ApiResponse({ reply: response }, 'Character communicated successfully.'));

  if (verifiedUser && chatHistory) {
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

    await Promise.all([
      updateContextMemory(verifiedUser, character, text, { genAI, openAI }),
      Memory.findByIdAndUpdate(chatHistory._id, {
        $push: {
          messages: {
            $each: [userResponse, characterResponse],
            $slice: -50,
          },
        },
      }),
    ]);
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

  if (!character.active) {
    return next(new ApiError(400, 'Character is disabled due to violation of rules!'));
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
// EDIT CHARACTER
// *************************************************************

export const editCharacter = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(
        400,
        'Empty Request Body: Please provide characterId and other edited fields in the request body!'
      )
    );
  }

  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const { data, error } = editCharacterSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const editData: CharacterEditData = data;

  const character = await Character.findById(editData.characterId).select('+avatarId +musicId');

  if (!character) {
    return next(new ApiError(404, 'Character does not exist!'));
  }

  if (!character.active) {
    return next(new ApiError(400, 'Character is disabled due to violation of rules!'));
  }

  if (verifiedUser.role === 'user' && !verifiedUser._id.equals(character.creator)) {
    return next(new ApiError(400, 'You are not allowed to edit characters not owned by you!'));
  }

  const uploadedFiles = req.files;

  let characterImage: ImageDocument | null = null;
  if (editData.imageId) {
    characterImage = await Image.findById(editData.imageId);

    if (!characterImage) {
      return next(new ApiError(404, 'Image does not exist! Please choose another one.'));
    }

    if (characterImage.usedByCharacter && !characterImage.usedByCharacter.equals(character._id)) {
      return next(
        new ApiError(
          400,
          `This image is being already used by one of your character! Please use another image.`
        )
      );
    }
  }

  if (editData.name && editData.name !== character.name) {
    const isSafeName = await contentModerator(editData.name);

    if (!isSafeName) {
      return next(new ApiError(400, 'Name contains inappropriate content!'));
    }
  }

  if (editData.description && editData.description !== character.description) {
    const isSafeDescription = await contentModerator(editData.description);

    if (!isSafeDescription) {
      return next(new ApiError(400, 'Description contains inappropriate content!'));
    }
  }

  if (editData.personality && editData.personality !== character.personality) {
    const isSafePersonalty = await contentModerator(editData.personality);

    if (!isSafePersonalty) {
      return next(new ApiError(400, 'Personality contains inappropriate content!'));
    }
  }

  if (editData.opening && editData.opening !== character.opening) {
    const isSafeOpening = await contentModerator(editData.opening);

    if (!isSafeOpening) {
      return next(new ApiError(400, 'Opening contains inappropriate content!'));
    }
  }

  let characterImagePath: string | null = null;
  let avatarImagePath: string | null = null;
  let musicImagePath: string | null = null;

  if (uploadedFiles) {
    if (
      !editData.imageId &&
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
    if (character.avatarId) {
      const avatarDeleteResult = await deleteFromCloudinary(
        character.avatarId,
        'image',
        cloudinary
      );

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
    if (character.musicId) {
      const musicDeleteResult = await deleteFromCloudinary(character.musicId, 'video', cloudinary);

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

  if (editData.imageId || uploadedImageDocument) {
    editData.characterImage = editData.imageId || uploadedImageDocument?._id.toString();

    const updatedImageDoc = await Image.findByIdAndUpdate(
      editData.characterImage,
      { $set: { usedByCharacter: character._id } },
      { new: true }
    );

    if (!updatedImageDoc || !updatedImageDoc.usedByCharacter.equals(character._id)) {
      return next(new ApiError(500, 'Error while saving changes!'));
    }
  }

  if (avatarUploadResult) {
    editData.characterAvatar = avatarUploadResult.secure_url;
    editData.avatarId = avatarUploadResult.public_id;
  }

  if (musicUploadResult) {
    editData.music = musicUploadResult.secure_url;
    editData.musicId = musicUploadResult.public_id;
  }

  delete editData.imageId;
  delete editData.characterId;

  if (editData.tags) editData.tags = JSON.parse(editData.tags);

  editData.active = true;

  const result = await runInTransaction(async session => {
    const updatedCharacter = await Character.findByIdAndUpdate(
      character._id,
      { $set: editData },
      {
        new: true,
        session,
      }
    );

    if (!updatedCharacter) {
      throw new Error('Failed to update character document!');
    }

    if (uploadedImageDocument) {
      const imageDoc = await Image.findById(character.characterImage).session(session);

      if (!imageDoc) throw new Error('Failed to load image document!');

      if (imageDoc.usedPrompt === 'Direct Upload') {
        const deletedDoc = await Image.findByIdAndDelete(character.characterImage, { session });

        if (!deletedDoc) {
          throw new Error('Failed to delete image document!');
        }
      } else {
        const updatedImageDoc = await Image.findByIdAndUpdate(
          character.characterImage,
          { $unset: { usedByCharacter: '' } },
          { new: true, session }
        );

        if (!updatedImageDoc || updatedImageDoc.usedByCharacter) {
          throw new Error('Failed to update image document!');
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
// DELETE CHARACTER MEDIA
// *************************************************************

export const deleteMedia = asyncHandler(async function (
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

  const { characterId, target } = data;

  if (!characterId) {
    return next(new ApiError(400, 'Character id is required!'));
  }

  const character = await Character.findById(characterId).select('+avatarId +musicId');

  if (!character) {
    return next(new ApiError(404, 'Character does not exist!'));
  }

  if (verifiedUser.role === 'user' && !verifiedUser._id.equals(character.creator)) {
    return next(
      new ApiError(400, 'You are not allowed to delete media of characters not owned by you!')
    );
  }

  if (target === 'avatar') {
    if (!character.avatarId) {
      return next(new ApiError(400, 'You have no avatar image to remove!'));
    }

    const deleteResult = await deleteFromCloudinary(character.avatarId, 'image', cloudinary);

    if (!deleteResult || !['ok', 'not found'].includes(deleteResult.result)) {
      return next(new ApiError(500, 'Failed to delete avatar image!'));
    }

    const updatedCharacter = await Character.findByIdAndUpdate(
      character._id,
      {
        $set: { characterAvatar: '', avatarId: '' },
      },
      { new: true }
    );

    if (!updatedCharacter || updatedCharacter.characterAvatar || updatedCharacter.avatarId) {
      return next(
        new ApiError(500, 'Failed to remove character avatar due to internal server error!')
      );
    }
  }

  if (target === 'music') {
    if (!character.musicId) {
      return next(new ApiError(400, 'You have no music to remove!'));
    }

    const deleteResult = await deleteFromCloudinary(character.musicId, 'video', cloudinary);

    if (!deleteResult || !['ok', 'not found'].includes(deleteResult.result)) {
      return next(new ApiError(500, 'Failed to delete the character music!'));
    }

    const updatedCharacter = await Character.findByIdAndUpdate(
      character._id,
      {
        $set: { music: '', musicId: '' },
      },
      { new: true }
    );

    if (!updatedCharacter || updatedCharacter.music || updatedCharacter.musicId) {
      return next(
        new ApiError(500, 'Failed to remove character music due to internal server error!')
      );
    }
  }

  res.status(200).json(new ApiResponse(null, `You have successfully removed ${target}.`));
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

  const character = await Character.findById(characterId).select('+avatarId +musicId');

  if (!character) {
    return next(new ApiError(404, 'Character does not exist!'));
  }

  if (verifiedUser.role === 'user' && !verifiedUser._id.equals(character.creator)) {
    return next(new ApiError(400, 'You are not allowed to delete characters not owned by you!'));
  }

  const characterImage = await Image.findById(character.characterImage).select('+imageId');

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

  if (character.avatarId) {
    const avatarDeleteResult = await deleteFromCloudinary(character.avatarId, 'image', cloudinary);

    if (!avatarDeleteResult || !['ok', 'not found'].includes(avatarDeleteResult.result)) {
      return next(new ApiError(500, 'Failed to delete avatar due to internal server error!'));
    }
  }

  if (character.musicId) {
    const musicDeleteResult = await deleteFromCloudinary(character.musicId, 'video', cloudinary);

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
    } else {
      const updatedImageDoc = await Image.findByIdAndUpdate(
        characterImage._id,
        { $unset: { usedByCharacter: '' } },
        { new: true, session }
      );

      if (!updatedImageDoc || updatedImageDoc.usedByCharacter) {
        throw new Error('Failed to update image document!');
      }
    }

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
      !updatedCreator ||
      updatedCreator.creations.some(id => id.equals(character._id))
    ) {
      throw new Error('Failed to delete documents!');
    }
  });

  if (result === 'error') {
    return next(new ApiError(500, 'Failed to delete due to internal server error!'));
  }

  await Promise.all([
    Memory.deleteMany({ character: character._id }),
    User.updateMany(
      {
        $or: [{ followingCharacters: character._id }, { communications: character._id }],
      },
      {
        $pull: {
          followingCharacters: character._id,
          communications: character._id,
        },
      }
    ),
  ]);

  res.status(200).json(new ApiResponse(null, 'Character deleted successfully.'));
});

// *************************************************************
// GET REPLY ADVICES
// *************************************************************

export const getPossibleReplies = asyncHandler(async function (
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

  if (!character.active) {
    return next(new ApiError(400, 'Character is disabled due to violation of rules!'));
  }

  if (
    verifiedUser.role === 'user' &&
    !verifiedUser.isPaid &&
    character.llmModel.startsWith('gpt')
  ) {
    return next(new ApiError(400, 'Paid subscription required to use GPT models!'));
  }

  const replies = await getReplyAdvices(character, verifiedUser, { genAI, openAI });

  if (replies === 'error') {
    return next(new ApiError(500, 'Failed to generate reply advices!'));
  }

  res
    .status(200)
    .json(new ApiResponse({ replies }, 'You have successfully received reply advices'));
});

// *************************************************************
// SET REMINDER
// *************************************************************

export const setReminder = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(
        400,
        'Empty Request Body: Please provide characterId, remindAt and message in the request body!'
      )
    );
  }

  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const { data, error } = reminderSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { characterId, remindAt, timezone, message } = data;

  const remindDate = new Date(remindAt);

  if (isNaN(remindDate.getTime())) {
    return next(new ApiError(400, 'Invalid reminder time provided!'));
  }

  const [character, memory] = await Promise.all([
    Character.findById(characterId),
    Memory.findOne({ character: characterId, user: verifiedUser._id }),
  ]);

  if (!character) {
    return next(new ApiError(404, 'Character does no longer exist!'));
  }

  if (!character.isApproved) {
    return next(new ApiError(400, 'Character is flagged as unsafe!'));
  }

  if (!character.active) {
    return next(new ApiError(400, 'Character is disabled due to violation of rules!'));
  }

  if (!memory) {
    return next(
      new ApiError(
        400,
        `You have to interact with the character before setting a reminder as ${character.name} does not know you!`
      )
    );
  }

  if (
    verifiedUser.role === 'user' &&
    !verifiedUser.isPaid &&
    character.llmModel.startsWith('gpt')
  ) {
    return next(new ApiError(400, 'Paid subscription required to use GPT models!'));
  }

  const humanTime = new Date(remindAt).toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const chatData: ChatData = {
    text: `User has set a reminder with you on ${humanTime}. User sent reminder text: ${message}. It is already ${humanTime} now, and user still did not show up. You have to reply based on the user sent reminder text, your personality and remind the user for the planned schedule. Your response should feel like a personal message directly from you - not a notification or system message. Response should be 200-300 words long.`,
    llmModel: character.llmModel,
    characterName: character.name,
    gender: character.gender,
    personality: character.personality,
    responseStyle: character.responseStyle,
    chatHistory: memory.messages,
    memory: memory.contextMemory,
  };

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

  const response = await communicate(chatData, { genAI, openAI });

  if (response === 'quota-exceeded') {
    return next(new ApiError(429, 'Quota exceeded! Please try again later.'));
  }

  if (response === 'error') {
    return next(new ApiError(500, 'Failed to set reminder with the character!'));
  }

  await agenda.schedule(remindDate, 'send reminder email', {
    userId: verifiedUser._id,
    userName: verifiedUser.fullname,
    userEmail: verifiedUser.email,
    characterName: character.name,
    characterId: character._id,
    message: response,
  });

  const reminderChat = {
    sender: 'user',
    content: `I set a plan with you on ${humanTime}: ${message}`,
    timestamp: new Date(),
  };

  await Memory.findByIdAndUpdate(memory._id, {
    $push: {
      messages: {
        $each: [reminderChat],
        $slice: -50,
      },
    },
  });

  res.status(200).json(new ApiResponse(null, 'Reminder was set successfully.'));
});

// *************************************************************
// CANCEL ALL REMINDERS
// *************************************************************

export const cancelAllReminders = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const { characterId } = req.params;

  const { data: charId, error } = objectIdSchema.safeParse(characterId);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  await agenda.cancel({
    name: 'send reminder email',
    'data.userId': verifiedUser._id,
    'data.characterId': charId,
  });

  res.status(200).json(new ApiResponse(null, 'All reminders were cleared successfully.'));
});

// *************************************************************
// REPORT CHARACTER
// *************************************************************

export const reportChaaracter = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(400, 'Empty or invalid input type was provided for character report!')
    );
  }

  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied!'));
  }

  const { data, error } = characterReportSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { characterId, reason } = data;

  const character = await Character.findById(characterId).select('+imageId').populate<{
    creator: UserDocument;
  }>('creator', 'fullname email');

  if (!character) {
    return next(new ApiError(404, 'Character does not exist!'));
  }

  const existingReport = await CharacterReport.findOne({ character: characterId });

  let report: CharacterReportDocument | null = null;

  if (!existingReport) {
    const reasonObj: ReportReasons = {
      offensive: 0,
      misinformation: 0,
      impersonation: 0,
      nsfw: 0,
      malicious: 0,
      unsafePersonality: 0,
    };

    reasonObj[reason]++;

    report = await CharacterReport.create({
      character: characterId,
      disapprovalCount: 0,
      reports: [verifiedUser._id],
      reasons: reasonObj,
    });
  } else {
    if (existingReport.reports.some(id => id.equals(verifiedUser._id))) {
      return next(new ApiError(404, 'You have already reported this character!'));
    }

    report = await CharacterReport.findByIdAndUpdate(
      existingReport._id,
      {
        $push: {
          reports: verifiedUser._id,
        },
        $inc: {
          [`reasons.${reason}`]: 1,
        },
      },
      { new: true }
    );
  }

  if (!report || !report.reports.some(id => id.equals(verifiedUser._id))) {
    return next(new ApiError(500, 'Failed to report character!'));
  }

  res.status(200).json(new ApiResponse(null, 'Character reported successfully.'));

  const { subject, text, html } = generateCharacterReportEmail(
    character.creator.fullname,
    character.name,
    reason
  );

  try {
    await sendMail(character.creator.email, subject, text, html);

    if (report.reports.length >= CHARACTER_DISAPPROVAL_THRESHOLD) {
      const inactivatedCharacter = await Character.findByIdAndUpdate(
        characterId,
        {
          $set: {
            isApproved: false,
          },
        },
        { new: true }
      );

      if (inactivatedCharacter && !inactivatedCharacter.isApproved) return;

      const updatedReport = await CharacterReport.findByIdAndUpdate(
        report._id,
        {
          $inc: {
            disapprovalCount: 1,
          },
        },
        { new: true }
      );

      if (updatedReport && updatedReport.disapprovalCount >= CHARACTER_DISABLE_THRESHOLD) {
        await Character.findByIdAndUpdate(character._id, {
          $set: {
            active: false,
          },
        });
      }
    }
  } catch (error) {
    return;
  }
});
