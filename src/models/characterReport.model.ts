import mongoose from 'mongoose';
import { CharacterReportDocument } from '../types/types';

const characterReportSchema = new mongoose.Schema<CharacterReportDocument>(
  {
    character: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character',
      required: true,
      index: true,
    },
    disapprovalCount: {
      type: Number,
      default: 0,
    },
    reports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reasons: {
      offensive: {
        type: Number,
        default: 0,
      },
      misinformation: {
        type: Number,
        default: 0,
      },
      impersonation: {
        type: Number,
        default: 0,
      },
      nsfw: {
        type: Number,
        default: 0,
      },
      malicious: {
        type: Number,
        default: 0,
      },
      unsafePersonality: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

const CharacterReport = mongoose.model<CharacterReportDocument>(
  'CharacterReport',
  characterReportSchema
);

export default CharacterReport;
