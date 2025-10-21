import mongoose from 'mongoose';
import { ImageDocument } from '../types/types';

const imageSchema = new mongoose.Schema<ImageDocument>(
  {
    image: {
      type: String,
      required: true,
    },
    imageId: {
      type: String,
      required: true,
      select: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    usedByCharacter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character',
    },
    usedPrompt: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

imageSchema.index({ user: 1, createdAt: -1 });

const Image = mongoose.model<ImageDocument>('Image', imageSchema);

export default Image;
