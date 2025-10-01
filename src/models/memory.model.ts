import mongoose from 'mongoose';
import { MemoryDocument } from '../types/types';

const memorySchema = new mongoose.Schema<MemoryDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    character: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character',
      required: true,
    },
    messages: [
      {
        sender: {
          type: String,
          required: true,
          enum: ['user', 'character'],
        },
        content: {
          type: String,
          required: true,
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
      maxlength: 200,
    },
  },
  { timestamps: true }
);

const Memory = mongoose.model<MemoryDocument>('Memory', memorySchema);

export default Memory;
