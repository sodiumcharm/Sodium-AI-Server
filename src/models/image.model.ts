import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
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

const Image = mongoose.model('Image', imageSchema);

export default Image;
