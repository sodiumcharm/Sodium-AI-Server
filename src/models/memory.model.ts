import mongoose from 'mongoose';
import { MemoryDocument } from '../types/types';

const memorySchema = new mongoose.Schema<MemoryDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    character: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character',
      required: true,
      index: true,
    },
    messages: [
      {
        sender: {
          type: String,
          required: true,
          enum: ['user', 'you'],
        },
        content: {
          type: String,
          required: true,
          maxLength: 1000,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    contextMemory: {
      type: String,
      default: '',
      maxLength: 1000,
    },
  },
  { timestamps: true }
);

const Memory = mongoose.model<MemoryDocument>('Memory', memorySchema);

export default Memory;
