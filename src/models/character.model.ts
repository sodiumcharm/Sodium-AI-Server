import mongoose from 'mongoose';
import { CharacterDocument } from '../types/types';

const characterSchema = new mongoose.Schema<CharacterDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    gender: {
      type: String,
      required: true,
      trim: true,
      enum: ['male', 'female', 'non-binary'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 500,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    communicatorCount: {
      type: Number,
      default: 0,
    },
    communicators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    isApproved: {
      type: Boolean,
      required: true,
      default: false,
    },
    relationship: {
      type: String,
      required: true,
      trim: true,
    },
    responseStyle: {
      type: String,
      required: true,
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
      required: true,
    },
    personality: {
      type: String,
      required: true,
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
    zodiac: {
      type: String,
      trim: true,
      enum: [
        'aries',
        'taurus',
        'gemini',
        'cancer',
        'leo',
        'virgo',
        'libra',
        'scorpio',
        'sagittarius',
        'capricorn',
        'aquarius',
        'pisces',
      ],
    },
    voice: {
      type: String,
      required: true,
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
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 1000,
    },
    llmModel: {
      type: String,
      required: true,
      trim: true,
    },
    dialogueStyle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DialogueStyle',
    },
    tags: {
      type: String,
      trim: true,
    },
    visibility: {
      type: String,
      required: true,
      trim: true,
      enum: ['public', 'private'],
    },
    reports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

const Character = mongoose.model<CharacterDocument>('Character', characterSchema);

export default Character;
