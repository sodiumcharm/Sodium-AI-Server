import { Response, NextFunction } from 'express';
import { UploadApiResponse } from 'cloudinary';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/apiError';
import ApiResponse from '../../utils/apiResponse';
import User from '../../models/user.model';
import Character from '../../models/character.model';
import { cloudinary, uploadToCloudinary, deleteFromCloudinary } from '../../services/cloudinary';
import contentModerator from '../../moderator/contentModerator';
import createNotification from '../../notification/notification';
import { AuthRequest, CommentData, CommentDocument } from '../../types/types';
import {
  editCommentSchema,
  getCommentsSchema,
  getRepliesSchema,
  postCommentSchema,
} from '../../validators/comment.validators';
import Comment from '../../models/comment.model';
import UserMerit from '../../models/merit.model';
import { registerSuspension } from '../user/user.utils';
import { COMMENT_BAN_THRESHOLD, SUSPEND_THRESHOLD } from '../../constants';

// *************************************************************
// LOAD COMMENTS
// *************************************************************

export const getComments = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const { data, error } = getCommentsSchema.safeParse(req.query);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { characterId, page, option } = data;

  const limit = 20;
  const skip = (page - 1) * limit;

  let comments: CommentDocument[] | null = null;
  let totalCount: number = 0;

  const selectedFields = 'commenter text image replies likesCount likes';
  const selectedCommenterFields = 'fullname profileImage mbti enneagram';

  if (option === 'all') {
    [comments, totalCount] = await Promise.all([
      Comment.find({ character: characterId, parentComment: null })
        .select(selectedFields)
        .populate('commenter', selectedCommenterFields)
        .skip(skip)
        .limit(limit),
      Comment.countDocuments({ character: characterId, parentComment: null }),
    ]);
  }

  if (option === 'top') {
    [comments, totalCount] = await Promise.all([
      Comment.find({ character: characterId, parentComment: null })
        .sort({ likesCount: -1 })
        .select(selectedFields)
        .populate('commenter', selectedCommenterFields)
        .skip(skip)
        .limit(limit),
      Comment.countDocuments({ character: characterId, parentComment: null }),
    ]);
  }

  if (option === 'recent') {
    [comments, totalCount] = await Promise.all([
      Comment.find({ character: characterId, parentComment: null })
        .sort({ createdAt: -1 })
        .select(selectedFields)
        .populate('commenter', selectedCommenterFields)
        .skip(skip)
        .limit(limit),
      Comment.countDocuments({ character: characterId, parentComment: null }),
    ]);
  }

  if (!comments) {
    return next(new ApiError(500, 'Failed to load comments!'));
  }

  res.status(200).json(
    new ApiResponse({
      comments,
      totalCount: totalCount ?? null,
      currentPage: page,
      hasMore: skip + comments.length < totalCount,
    })
  );
});

// *************************************************************
// LOAD REPLIES
// *************************************************************

export const getReplies = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const { data, error } = getRepliesSchema.safeParse(req.query);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { commentId, page } = data;

  const limit = 20;
  const skip = (page - 1) * limit;

  const [comments, totalCount] = await Promise.all([
    Comment.find({ parentComment: commentId })
      .select('commenter text image replies likesCount likes')
      .populate('commenter', 'fullname profileImage mbti enneagram')
      .skip(skip)
      .limit(limit),
    Comment.countDocuments({ parentComment: commentId }),
  ]);

  if (!comments) {
    return next(new ApiError(500, 'Failed to load comments!'));
  }

  res.status(200).json(
    new ApiResponse({
      comments,
      totalCount: totalCount ?? null,
      currentPage: page,
      hasMore: skip + comments.length < totalCount,
    })
  );
});

// *************************************************************
// POST COMMENT
// *************************************************************

export const postComment = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(
      new ApiError(
        400,
        'Empty Request Body: Please provide characterId, parentCommentId (optional) and text!'
      )
    );
  }

  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { data, error } = postCommentSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { characterId, parentCommentId, text } = data;

  const upload = req.file;

  if (!upload && !text) {
    return next(new ApiError(400, 'Please provide text or image!'));
  }

  const character = await Character.findById(characterId);

  if (!character) {
    return next(new ApiError(404, 'Character does not exist!'));
  }

  let parentComment: CommentDocument | null = null;
  if (parentCommentId) {
    parentComment = await Comment.findById(parentCommentId);

    if (!parentComment) {
      return next(new ApiError(404, 'Comment does not exist!'));
    }
  }

  let uploadResult: UploadApiResponse | null = null;
  if (upload) {
    const imagePath = upload.path;

    uploadResult = await uploadToCloudinary(imagePath, 'images', {
      cloudinary,
      deleteTempFile: true,
    });

    if (!uploadResult) {
      return next(new ApiError(500, 'Failed to upload the image!'));
    }
  }

  const commentObj: CommentData = {
    character: characterId,
    commenter: verifiedUser._id,
    parentComment: parentCommentId || null,
    image: uploadResult?.secure_url || '',
    imageId: uploadResult?.public_id || '',
  };

  if (text) commentObj.text = text;

  const [comment, _] = await Promise.all([
    Comment.create(commentObj),
    createNotification('comment', verifiedUser._id, {
      receiverUser: character.creator,
      receiverCharacter: character._id,
    }),
  ]);

  if (!comment) {
    return next(new ApiError(500, 'Error while posting comment!'));
  }

  if (parentComment && parentCommentId) {
    const [updatedParentComment, _] = await Promise.all([
      Comment.findByIdAndUpdate(
        parentCommentId,
        {
          $inc: { replies: 1 },
        },
        { new: true }
      ),
      createNotification('reply', verifiedUser._id, {
        receiverUser: parentComment.commenter,
        receiverCharacter: character._id,
      }),
    ]);

    if (!updatedParentComment || updatedParentComment.replies === parentComment.replies) {
      return next(new ApiError(500, 'Error while posting reply!'));
    }
  }

  res.status(201).json(new ApiResponse({ comment }, 'Comment is successfully posted.'));
});

// *************************************************************
// EDIT COMMENT
// *************************************************************

export const editComment = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.body) {
    return next(new ApiError(400, 'Empty Request Body: Please provide commentId, and text!'));
  }

  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { data, error } = editCommentSchema.safeParse(req.body);

  if (error) {
    return next(new ApiError(400, error.issues[0].message));
  }

  const { commentId, text } = data;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(new ApiError(404, 'Comment does not exist!'));
  }

  if (verifiedUser.role === 'user' && !comment.commenter.equals(verifiedUser._id)) {
    return next(new ApiError(400, 'You are not allowed to edit comments not posted by you!'));
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    comment._id,
    {
      $set: { text },
    },
    { new: true }
  );

  if (!updatedComment || updatedComment.text !== text) {
    return next(new ApiError(500, 'Failed to update the comment!'));
  }

  res.status(200).json(new ApiResponse(null, 'Comment updated successfully.'));
});

// *************************************************************
// DELETE COMMENT
// *************************************************************

export const deleteComment = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { commentId } = req.params;

  const comment = await Comment.findById(commentId).select('+imageId');

  if (!comment) {
    return next(new ApiError(404, 'Comment does not exist!'));
  }

  if (verifiedUser.role === 'user' && !comment.commenter.equals(verifiedUser._id)) {
    return next(new ApiError(400, 'You are not allowed to delete comments not posted by you!'));
  }

  if (comment.image && comment.imageId) {
    const deleteResult = await deleteFromCloudinary(comment.imageId, 'image', cloudinary);

    if (!deleteResult || !['ok', 'not found'].includes(deleteResult.result)) {
      return next(new ApiError(500, 'Failed to delete comment due to internal server error!'));
    }
  }

  const [deletedComment, _] = await Promise.all([
    Comment.findByIdAndDelete(comment._id),
    Comment.deleteMany({ parentComment: comment._id }),
  ]);

  if (!deletedComment) {
    return next(new ApiError(500, 'Failed to delete comment due to internal server error!'));
  }

  if (comment.parentComment) {
    await Comment.findByIdAndUpdate(comment.parentComment, {
      $inc: { replies: -1 },
    });
  }

  res.status(200).json(new ApiResponse(null, 'Comment was deleted successfully.'));
});

// *************************************************************
// LIKE COMMENT
// *************************************************************

export const likeComment = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(new ApiError(404, 'Comment does not exist!'));
  }

  let liked: boolean = false;

  if (comment.likes.some(id => id.equals(verifiedUser._id))) {
    liked = false;

    const [updatedComment, _] = await Promise.all([
      Comment.findByIdAndUpdate(
        comment._id,
        {
          $inc: { likesCount: -1 },
          $pull: { likes: verifiedUser._id },
        },
        { new: true }
      ),
      User.findByIdAndUpdate(
        comment.commenter,
        {
          $inc: { socialMerit: -1 },
        },
        { new: true }
      ),
    ]);

    if (
      !updatedComment ||
      updatedComment.likesCount === comment.likesCount ||
      updatedComment.likes.some(id => id.equals(verifiedUser._id))
    ) {
      return next(new ApiError(500, 'Failed to unlike the comment!'));
    }
  } else {
    liked = true;

    const [updatedComment, _] = await Promise.all([
      Comment.findByIdAndUpdate(
        comment._id,
        {
          $inc: { likesCount: 1 },
          $addToSet: { likes: verifiedUser._id },
        },
        { new: true }
      ),
      User.findByIdAndUpdate(
        comment.commenter,
        {
          $inc: { socialMerit: 1 },
        },
        { new: true }
      ),
    ]);

    if (
      !updatedComment ||
      updatedComment.likesCount === comment.likesCount ||
      !updatedComment.likes.some(id => id.equals(verifiedUser._id))
    ) {
      return next(new ApiError(500, 'Failed to like the comment!'));
    }
  }

  res
    .status(200)
    .json(new ApiResponse({ liked }, `Comment was ${liked ? 'liked' : 'unliked'} successfully.`));
});

// *************************************************************
// REPORT COMMENT
// *************************************************************

export const reportComment = asyncHandler(async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const verifiedUser = req.user;

  if (!verifiedUser) {
    return next(new ApiError(401, 'Unauthorized request denied! Please login first.'));
  }

  const { commentId } = req.params;

  const comment = await Comment.findById(commentId).select('+imageId');

  if (!comment) {
    return next(new ApiError(404, 'Comment does not exist!'));
  }

  if (comment.reports.some(id => id.equals(verifiedUser._id))) {
    return next(new ApiError(404, 'You have already reported this comment!'));
  }

  const reportedComment = await Comment.findByIdAndUpdate(
    comment._id,
    {
      $addToSet: { reports: verifiedUser._id },
    },
    { new: true }
  );

  if (!reportedComment || !reportedComment.reports.some(id => id.equals(verifiedUser._id))) {
    return next(new ApiError(500, 'Failed to register the report!'));
  }

  res.status(200).json(new ApiResponse(null, 'Comment was reported successfully.'));

  try {
    let existingMerit = await UserMerit.findOne({ user: comment.commenter });

    if (!existingMerit) {
      existingMerit = await UserMerit.create({
        user: comment.commenter,
        reports: [verifiedUser._id],
      });
    } else {
      existingMerit = await UserMerit.findOneAndUpdate(
        { user: comment.commenter },
        {
          $addToSet: { reports: verifiedUser._id },
        },
        { new: true }
      );
    }

    await User.findByIdAndUpdate(comment.commenter, {
      $inc: { socialMerit: -1 },
    });

    if (existingMerit && existingMerit.reports.length >= SUSPEND_THRESHOLD) {
      await registerSuspension(comment.commenter, 'User was reported by multiple users');
    }

    if (reportedComment.reports.length < COMMENT_BAN_THRESHOLD) return;

    if (comment.text) {
      const isSafeComment = await contentModerator(comment.text);

      if (isSafeComment) return;

      if (comment.imageId) {
        await deleteFromCloudinary(comment.imageId, 'image', cloudinary);
      }

      await Promise.all([
        Comment.findByIdAndDelete(comment._id),
        Comment.deleteMany({ parentComment: comment._id }),
      ]);
    }
  } catch (error) {
    return;
  }
});
