import mongoose from 'mongoose';
import { SecretCodeDocument } from '../types/types';

const secretCodeSchema = new mongoose.Schema<SecretCodeDocument>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 1800,
  },
});

const SecretCode = mongoose.model<SecretCodeDocument>('SecretCode', secretCodeSchema);

export default SecretCode;
