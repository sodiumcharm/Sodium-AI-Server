import mongoose from 'mongoose';
import { DraftDocument } from '../types/types';

const draftSchema = new mongoose.Schema<DraftDocument>(
  {
    name: {
      type: String,
      trim: true,
      minlength: 0,
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
      minlength: 0,
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
      minlength: 0,
      maxlength: 5000,
    },
    mbti: {
      type: String,
      trim: true,
      enum: [
        'ISTJ',
        'ISFJ',
        'INFJ',
        'INTJ',
        'ISTP',
        'ISFP',
        'INFP',
        'INTP',
        'ESTP',
        'ESFP',
        'ENFP',
        'ENTP',
        'ESTJ',
        'ESFJ',
        'ENFJ',
        'ENTJ',
      ],
    },
    enneagram: {
      type: String,
      trim: true,
      enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
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
      minlength: 0,
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
