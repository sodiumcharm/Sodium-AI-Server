import mongoose from 'mongoose';
import { PersonalityResultDocument } from '../types/types';

const personalityTestResultSchema = new mongoose.Schema<PersonalityResultDocument>(
  {
    testName: {
      type: String,
      trim: true,
      required: true,
      enum: ['mbti', 'enneagram', 'attachmentStyle', 'selfEsteem', 'EQ'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    mbtiAnalysis: {
      Fe: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      Fi: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      Te: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      Ti: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      Ne: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      Ni: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      Se: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      Si: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
    },
    result: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const PersonalityResult = mongoose.model<PersonalityResultDocument>(
  'PersonalityResult',
  personalityTestResultSchema
);

export default PersonalityResult;
