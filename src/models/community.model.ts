import mongoose from 'mongoose';
import { CommunityDocument } from '../types/types';

const communitySchema = new mongoose.Schema<CommunityDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      maxlength: 200,
    },
    image: {
      type: String,
    },
    imageId: {
      type: String,
    },
  },
  { timestamps: true }
);

const Community = mongoose.model<CommunityDocument>('Community', communitySchema);

export default Community;
