import mongoose, { Document, Types } from 'mongoose';
import { SuspensionDocument } from '../types/types';

const suspendSchema = new mongoose.Schema<SuspensionDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    suspensionEndDate: {
      type: Date,
      required: true,
    },
    suspensionCount: {
      type: Number,
      default: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Suspend = mongoose.model<SuspensionDocument>('Suspend', suspendSchema);

export default Suspend;
