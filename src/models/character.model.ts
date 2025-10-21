import mongoose from 'mongoose';
import { CharacterDocument } from '../types/types';

const characterSchema = new mongoose.Schema<CharacterDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 50,
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
      minLength: 1,
      maxLength: 500,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    followerCount: {
      type: Number,
      default: 0,
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
      index: true,
    },
    relationship: {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 100,
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
      minLength: 20,
      maxLength: 5000,
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
      minLength: 2,
      maxLength: 1000,
    },
    llmModel: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gpt-5',
        'gpt-5-turbo',
        'gpt-5-32k',
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-3.5-turbo',
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    visibility: {
      type: String,
      required: true,
      trim: true,
      enum: ['public', 'private'],
      index: true,
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
