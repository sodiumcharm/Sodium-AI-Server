import mongoose from 'mongoose';
import { CommentDocument } from '../types/types';

const commentSchema = new mongoose.Schema<CommentDocument>(
  {
    character: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character',
      required: true,
      index: true,
    },
    commenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    text: {
      type: String,
      maxlength: 800,
    },
    image: {
      type: String,
    },
    imageId: {
      type: String,
      select: false,
    },
    replies: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

commentSchema.index({ likesCount: -1, createdAt: -1 });

const Comment = mongoose.model<CommentDocument>('Comment', commentSchema);

export default Comment;
