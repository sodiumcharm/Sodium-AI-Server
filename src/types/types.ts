import { Request, Response, NextFunction } from 'express';
import { Types, Document } from 'mongoose';

export type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export type EnvObject = {
  PORT: string;
  NODE_ENV: string;
  ALLOWED_ORIGINS: string[];
  MONGODB_URI: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  GEMINI_API_KEY: string;
  HUGGING_FACE_TOKEN: string;
  GOOGLE_APP_PASSWORD: string;
  ACCESS_TOKEN_SECRET: string;
  ACCESS_TOKEN_EXPIRY: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

export type CloudinaryDestroyResult = {
  result: 'ok' | 'not found' | 'error';
};

export interface UserDocument extends Document {
  fullname: string;
  username: string;
  lastUsernameChanged?: Date;
  usernameCooldown: number;
  registeredBy: 'credentials' | 'google';
  email: string;
  isEmailVerified: boolean;
  password?: string;
  passwordChangedAt?: Date;
  profileImage?: string;
  profileImageId?: string;
  refreshToken?: string;
  twoFAEnabled: boolean;
  gender: 'male' | 'female' | 'unknown';
  personality?: string;
  subscriberCount: number;
  subscribers: Types.ObjectId[];
  subscribingCount: number;
  subscribing: Types.ObjectId[];
  totalFollowers: number;
  creationCount: number;
  creations: Types.ObjectId[];
  drafts: Types.ObjectId[];
  createdDialogues: Types.ObjectId[];
  followingCharacters: Types.ObjectId[];
  communications: Types.ObjectId[];
  savedImages: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  isPasswordChangedAfter(jwtIssueTime: number): boolean;
}

declare global {
  namespace Express {
    interface User extends UserDocument {}
  }
}

export interface CharacterDocument extends Document {
  name: string;
  gender: 'male' | 'female' | 'non-binary';
  description: string;
  creator?: Types.ObjectId;
  followers: Types.ObjectId[];
  communicatorCount: number;
  communicators: Types.ObjectId[];
  comments: Types.ObjectId[];
  isApproved: boolean;
  relationship: string;
  responseStyle: 'role-play' | 'professional';
  characterAvatar?: string;
  avatarId?: string;
  characterImage: Types.ObjectId;
  personality: string;
  mbti?: string;
  enneagram?: number;
  attachmentStyle: 'secure' | 'anxious' | 'avoidant' | 'disorganised';
  zodiac?: string;
  voice: string;
  music?: string;
  musicId?: string;
  opening: string;
  llmModel: string;
  dialogueStyle?: Types.ObjectId;
  tags?: string;
  visibility: 'public' | 'private';
  reports: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageDocument extends Document {
  sender: 'user' | 'character';
  content: string;
  timestamp: Date;
}

export interface MemoryDocument extends Document {
  user: Types.ObjectId;
  character: Types.ObjectId;
  messages: MessageDocument[];
  contextMemory: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DraftDocument extends Document {
  name?: string;
  gender?: 'male' | 'female' | 'non-binary';
  description?: string;
  creator?: Types.ObjectId;
  relationship?: string;
  responseStyle?: 'role-play' | 'professional';
  characterAvatar?: string;
  avatarId?: string;
  characterImage?: Types.ObjectId;
  personality?: string;
  mbti?: string;
  enneagram?: number;
  attachmentStyle: 'secure' | 'anxious' | 'avoidant' | 'disorganised';
  voice?: string;
  music?: string;
  musicId?: string;
  opening?: string;
  llmModel?: string;
  dialogueStyle?: Types.ObjectId;
  tags?: string;
  visibility?: 'public' | 'private';
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageDocument extends Document {
  image: string;
  imageId: string;
  usedPrompt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentDocument extends Document {
  character: Types.ObjectId;
  commenter: Types.ObjectId;
  parentComment?: Types.ObjectId | null;
  text?: string;
  image?: string;
  imageId?: string;
  replies: Types.ObjectId[];
  likesCount: number;
  likes: Types.ObjectId[];
  reports: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityDocument extends Document {
  user: Types.ObjectId;
  text?: string;
  image?: string;
  imageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OtpDocument extends Document {
  userId: Types.ObjectId;
  otp: string;
  context: '2FA' | 'verify-email' | 'forgot-password';
  attempts: number;
  createdAt: Date;
}

export interface DialogueMessageDocument extends Document {
  sender: 'user' | 'character';
  content: string;
}

export interface DialogueDocument extends Document {
  user: Types.ObjectId;
  dialogueName: string;
  description: string;
  dialogues: DialogueMessageDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export type ImagePrompt = {
  generic: string;
  realistic: string;
  anime: string;
  horror: string;
  fantasy: string;
};

export interface AuthRequest extends Request {
  user?: UserDocument;
}

export type Mail = {
  subject: string;
  text: string;
  html: string;
};

export type SuccessResult = {
  statusCode: 200 | 201 | 400 | 401 | 403 | 405 | 500;
  success: boolean;
  message: string;
};

export type TokenGenerationResult = {
  accessToken: string;
  refreshToken: string;
  user?: UserDocument;
  success: SuccessResult;
};
