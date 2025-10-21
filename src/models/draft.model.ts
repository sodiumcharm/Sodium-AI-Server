import mongoose from 'mongoose';
import { DraftDocument } from '../types/types';

const draftSchema = new mongoose.Schema<DraftDocument>(
  {
    name: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    gender: {
      type: String,
      trim: true,
      enum: ['male', 'female', 'non-binary'],
    },
    description: {
      type: String,
      trim: true,
      minlength: 20,
      maxlength: 500,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    relationship: {
      type: String,
      trim: true,
    },
    responseStyle: {
      type: String,
      trim: true,
      enum: ['role-play', 'professional'],
    },
    characterAvatar: {
      type: String,
    },
    avatarId: {
      type: String,
      select: false,
    },
    characterImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
    },
    personality: {
      type: String,
      trim: true,
      minlength: 20,
      maxlength: 5000,
    },
    mbti: {
      type: String,
      trim: true,
      minlength: 4,
      maxlength: 4,
    },
    enneagram: {
      type: Number,
      trim: true,
      max: 9,
      min: 1,
    },
    attachmentStyle: {
      type: String,
      default: 'secure',
      enum: ['secure', 'anxious', 'avoidant', 'disorganised'],
    },
    voice: {
      type: String,
      trim: true,
    },
    music: {
      type: String,
    },
    musicId: {
      type: String,
      select: false,
    },
    opening: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 1000,
    },
    llmModel: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    visibility: {
      type: String,
      trim: true,
      enum: ['public', 'private'],
    },
  },
  { timestamps: true }
);

const Draft = mongoose.model<DraftDocument>('Draft', draftSchema);

export default Draft;
