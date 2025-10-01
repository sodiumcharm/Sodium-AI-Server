import mongoose from 'mongoose';
import { OtpDocument } from '../types/types';

const otpSchema = new mongoose.Schema<OtpDocument>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  context: {
    type: String,
    required: true,
    enum: ['2FA', 'verify-email', 'forgot-password'],
  },
  attempts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300,
  },
});

const OTP = mongoose.model<OtpDocument>('OTP', otpSchema);

export default OTP;
