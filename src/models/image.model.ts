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
    usedPrompt: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Image = mongoose.model<ImageDocument>('Image', imageSchema);

export default Image;
