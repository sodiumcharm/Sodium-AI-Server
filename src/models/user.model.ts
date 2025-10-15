import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserDocument } from '../types/types';
import validator from 'validator';
import { isValidName, isValidUsername } from '../utils/validators';
import { config } from '../config/config';

const userSchema = new mongoose.Schema<UserDocument>(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
      validate: [isValidName, 'Please provide a valid name'],
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      validate: [isValidUsername, 'Please provide a valid username'],
      index: true,
    },
    lastUsernameChanged: {
      type: Date,
    },
    usernameCooldown: {
      type: Number,
      default: 2,
    },
    registeredBy: {
      type: String,
      required: true,
      trim: true,
      enum: ['credentials', 'google'],
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
    },
    passwordChangedAt: {
      type: Date,
    },
    profileImage: {
      type: String,
    },
    profileImageId: {
      type: String,
      select: false,
    },
    profileDescription: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    refreshToken: {
      type: String,
    },
    twoFAEnabled: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: 'user',
      enum: ['user', 'admin'],
    },
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'suspended', 'banned'],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    gender: {
      type: String,
      trim: true,
      default: 'unknown',
      enum: ['male', 'female', 'unknown'],
    },
    personality: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    mbti: {
      type: String,
      trim: true,
      enum: [
        'ISTJ',
        'ISFJ',
        'INFJ',
        'INTJ',
        'ISTP',
        'ISFP',
        'INFP',
        'INTP',
        'ESTP',
        'ESFP',
        'ENFP',
        'ENTP',
        'ESTJ',
        'ESFJ',
        'ENFJ',
        'ENTJ',
      ],
    },
    enneagram: {
      type: String,
      trim: true,
      enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    },
    attachmentStyle: {
      type: String,
      trim: true,
      enum: ['secure', 'anxious', 'avoidant', 'disorganised'],
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
    notifications: [
      {
        notificationType: {
          type: String,
          required: true,
          trim: true,
          enum: ['subscribe', 'communicate', 'comment', 'follow', 'new'],
        },
        emitter: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        receiverUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        receiverCharacter: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Character',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  if (this.password && this.password.trim().length >= 1)
    this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    config.ACCESS_TOKEN_SECRET,
    {
      expiresIn: config.ACCESS_TOKEN_EXPIRY as any,
    }
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign({ _id: this._id }, config.REFRESH_TOKEN_SECRET, {
    expiresIn: config.REFRESH_TOKEN_EXPIRY as any,
  });
};

userSchema.methods.isPasswordChangedAfter = function (jwtIssueTime: number): boolean {
  if (this.passwordChangedAt) {
    const passwordChangingTime = this.passwordChangedAt.getTime() / 1000;
    return jwtIssueTime < passwordChangingTime;
  }
  return false;
};

const User = mongoose.model<UserDocument>('User', userSchema);

export default User;
