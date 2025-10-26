import mongoose from 'mongoose';
import { MeritDocument } from '../types/types';

const userMerit = new mongoose.Schema<MeritDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    meritContributors: [
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

const UserMerit = mongoose.model<MeritDocument>('UserMerit', userMerit);

export default UserMerit;
