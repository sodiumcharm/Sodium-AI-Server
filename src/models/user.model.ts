import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
    },
    profileImage: {
      type: String,
      required: true,
    },
    profileImageId: {
      type: String,
      select: false,
    },
    refreshToken: {
      type: String,
    },
    gender: {
      type: String,
      trim: true,
      default: 'unknown',
      enum: ['male', 'female'],
    },
    personality: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    subscriberCount: {
      type: Number,
      default: 0,
    },
    subscribers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    subscribingCount: {
      type: Number,
      default: 0,
    },
    subscribing: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    totalFollowers: {
      type: Number,
      default: 0,
    },
    creationCount: {
      type: Number,
      default: 0,
    },
    creations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Character',
      },
    ],
    drafts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Draft',
      },
    ],
    createdDialogues: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DialogueStyle',
      },
    ],
    followingCharacters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Character',
      },
    ],
    communications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Character',
      },
    ],
    savedImages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image',
      },
    ],
    activeOtp: {
      type: String,
      maxLength: 6,
      minlength: 6,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      select: false,
    },
    otpAttempts: {
      type: Number,
      select: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
