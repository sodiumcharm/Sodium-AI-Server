import { Request, Response, NextFunction } from 'express';
import { Types, Document } from 'mongoose';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { cloudinary } from '../services/cloudinary';
import { JobAttributesData } from 'agenda';

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
  HUGGING_FACE_BACKUP_TOKEN: string;
  GOOGLE_APP_PASSWORD: string;
  ACCESS_TOKEN_SECRET: string;
  ACCESS_TOKEN_EXPIRY: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  OPENAI_API_KEY: string;
};

export type CloudinaryDestroyResult = {
  result: 'ok' | 'not found' | 'error';
};

export type ImageStyle = 'realistic' | 'anime' | 'fantasy' | 'horror';

export type NotificationType =
  | 'subscribe'
  | 'communicate'
  | 'comment'
  | 'reply'
  | 'follow'
  | 'new'
  | 'suspension'
  | 'ban'
  | 'characterDisabled'
  | 'casual';

export type Notification = {
  origin: 'user' | 'system';
  notificationType: NotificationType;
  text?: string;
  image?: string;
  emitter?: Types.ObjectId;
  receiverUser?: Types.ObjectId;
  receiverCharacter?: Types.ObjectId;
  createdAt?: Date;
};

export type ModelMemory = {
  'gemini-2.5-flash': number;
  'gemini-2.5-pro': number;
  'gemini-2.5-flash-lite': number;
  'gemini-2.0-flash': number;
  'gemini-2.0-flash-lite': number;
  'gpt-5': number;
  'gpt-5-turbo': number;
  'gpt-5-32k': number;
  'gpt-4': number;
  'gpt-4-turbo': number;
  'gpt-4o': number;
  'gpt-4o-mini': number;
  'gpt-3.5-turbo': number;
};

export type TestName = 'mbti' | 'enneagram' | 'attachment-type' | 'selfEsteem' | 'EQ';

export type ResponseStyle = 'role-play' | 'professional';

export type LlmModel =
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-lite'
  | 'gpt-5'
  | 'gpt-5-turbo'
  | 'gpt-5-32k'
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-3.5-turbo';

export type MbtiType =
  | 'ISTJ'
  | 'ISFJ'
  | 'INFJ'
  | 'INTJ'
  | 'ISTP'
  | 'ISFP'
  | 'INFP'
  | 'INTP'
  | 'ESTP'
  | 'ESFP'
  | 'ENFP'
  | 'ENTP'
  | 'ESTJ'
  | 'ESFJ'
  | 'ENFJ'
  | 'ENTJ';

export type MbtiFunction = 'Fe' | 'Fi' | 'Te' | 'Ti' | 'Ne' | 'Ni' | 'Se' | 'Si';

export type MainMbtiFunctions =
  | 'Si-Te-Fi-Ne'
  | 'Si-Fe-Ti-Ne'
  | 'Ni-Fe-Ti-Se'
  | 'Ni-Te-Fi-Se'
  | 'Ti-Se-Ni-Fe'
  | 'Fi-Se-Ni-Te'
  | 'Fi-Ne-Si-Te'
  | 'Ti-Ne-Si-Fe'
  | 'Se-Ti-Fe-Ni'
  | 'Se-Fi-Te-Ni'
  | 'Ne-Fi-Te-Si'
  | 'Ne-Ti-Fe-Si'
  | 'Te-Si-Ne-Fi'
  | 'Fe-Si-Ne-Ti'
  | 'Fe-Ni-Se-Ti'
  | 'Te-Ni-Se-Fi';

export type MbtiMap = {
  'Si-Te-Fi-Ne': 'ISTJ';
  'Si-Fe-Ti-Ne': 'ISFJ';
  'Ni-Fe-Ti-Se': 'INFJ';
  'Ni-Te-Fi-Se': 'INTJ';
  'Ti-Se-Ni-Fe': 'ISTP';
  'Fi-Se-Ni-Te': 'ISFP';
  'Fi-Ne-Si-Te': 'INFP';
  'Ti-Ne-Si-Fe': 'INTP';
  'Se-Ti-Fe-Ni': 'ESTP';
  'Se-Fi-Te-Ni': 'ESFP';
  'Ne-Fi-Te-Si': 'ENFP';
  'Ne-Ti-Fe-Si': 'ENTP';
  'Te-Si-Ne-Fi': 'ESTJ';
  'Fe-Si-Ne-Ti': 'ESFJ';
  'Fe-Ni-Se-Ti': 'ENFJ';
  'Te-Ni-Se-Fi': 'ENTJ';
};

export type MbtiScore = {
  [key in MbtiFunction]: number;
};

export type MbtiAssessmentStatement = {
  id: number;
  text: string;
  targetFunction: MbtiFunction;
};

export type SelfEsteemStatement = {
  id: number;
  text: string;
  baseScore: 1 | -1;
};

export type MbtiTestResult = {
  success: boolean;
  type?: MbtiType;
  score?: MbtiScore;
  details?: string;
};

export type Zodiac =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type AttachmentType = 'secure' | 'anxious' | 'avoidant' | 'disorganised';

export type CharacterGender = 'male' | 'female' | 'non-binary';

export type EnneagramType = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export interface UserDocument extends Document {
  _id: Types.ObjectId;
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
  profileDescription: string;
  refreshToken?: string;
  twoFAEnabled: boolean;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  isPaid: boolean;
  plan: 'free-tier' | 'sodium-pro';
  gender: 'male' | 'female' | 'unknown';
  personality?: string;
  mbti?: MbtiType;
  enneagram?: EnneagramType;
  attachmentStyle: AttachmentType;
  subscriberCount: number;
  subscribers: Types.ObjectId[];
  subscribingCount: number;
  subscribing: Types.ObjectId[];
  totalFollowers: number;
  creationCount: number;
  createdAt: Date;
  updatedAt: Date;
  notifications: Notification[];
  socialMerit: number;
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  isPasswordChangedAfter(jwtIssueTime: number): boolean;
}

declare global {
  namespace Express {
    interface User extends UserDocument {}

    interface Request {
      files?: {
        characterImage?: Express.Multer.File[];
        characterAvatar?: Express.Multer.File[];
        music?: Express.Multer.File[];
      };
    }
  }
}

export interface CharacterDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  gender: CharacterGender;
  description: string;
  creator: Types.ObjectId;
  followerCount: number;
  followers: Types.ObjectId[];
  communicatorCount: number;
  communicators: Types.ObjectId[];
  isApproved: boolean;
  active: boolean;
  relationship: string;
  responseStyle: ResponseStyle;
  characterAvatar?: string;
  avatarId?: string;
  characterImage: Types.ObjectId;
  personality: string;
  mbti?: MbtiType;
  enneagram?: EnneagramType;
  attachmentStyle: AttachmentType;
  zodiac?: Zodiac;
  voice: string;
  music?: string;
  musicId?: string;
  opening: string;
  llmModel: LlmModel;
  tags?: string[];
  visibility: 'public' | 'private';
  createdAt: Date;
  updatedAt: Date;
}

export type CharacterData = {
  name: string;
  gender: CharacterGender;
  description: string;
  creator?: string;
  relationship: string;
  responseStyle: ResponseStyle;
  isApproved?: boolean;
  characterAvatar?: string;
  avatarId?: string;
  characterImage?: string;
  imageId?: string;
  personality: string;
  mbti?: MbtiType;
  enneagram?: EnneagramType;
  attachmentStyle?: AttachmentType;
  zodiac?: Zodiac;
  voice?: string;
  music?: string;
  musicId?: string;
  opening: string;
  llmModel?: LlmModel;
  tags?: string;
  visibility?: 'public' | 'private';
};

export type CharacterEditData = {
  characterId?: string;
  name?: string;
  description?: string;
  relationship?: string;
  responseStyle?: ResponseStyle;
  characterAvatar?: string;
  avatarId?: string;
  characterImage?: string;
  imageId?: string;
  active?: boolean;
  personality?: string;
  mbti?: MbtiType;
  enneagram?: EnneagramType;
  attachmentStyle?: AttachmentType;
  zodiac?: Zodiac;
  voice?: string;
  music?: string;
  musicId?: string;
  opening?: string;
  llmModel?: LlmModel;
  tags?: string;
  visibility?: 'public' | 'private';
};

export type MessageDocument = {
  sender: 'user' | 'you';
  content: string;
  timestamp: Date;
};

export interface MemoryDocument extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  character: Types.ObjectId;
  messages: MessageDocument[];
  contextMemory: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DraftDocument extends Document {
  _id: Types.ObjectId;
  name?: string;
  gender?: CharacterGender;
  description?: string;
  creator: Types.ObjectId;
  relationship?: string;
  responseStyle?: ResponseStyle;
  characterAvatar?: string;
  avatarId?: string;
  characterImage?: Types.ObjectId;
  personality?: string;
  mbti?: MbtiType;
  enneagram?: EnneagramType;
  attachmentStyle?: AttachmentType;
  zodiac?: Zodiac;
  voice?: string;
  music?: string;
  musicId?: string;
  opening?: string;
  llmModel?: LlmModel;
  tags?: string[];
  visibility?: 'public' | 'private';
  createdAt: Date;
  updatedAt: Date;
}

export type DraftData = {
  draftId?: string;
  name?: string;
  gender?: CharacterGender;
  description?: string;
  creator?: string;
  relationship?: string;
  responseStyle?: ResponseStyle;
  characterAvatar?: string;
  avatarId?: string;
  characterImage?: string;
  imageId?: string;
  personality?: string;
  mbti?: MbtiType;
  enneagram?: EnneagramType;
  attachmentStyle?: AttachmentType;
  zodiac?: Zodiac;
  voice?: string;
  music?: string;
  musicId?: string;
  opening?: string;
  llmModel?: LlmModel;
  tags?: string;
  visibility?: 'public' | 'private';
};

export interface ImageDocument extends Document {
  _id: Types.ObjectId;
  image: string;
  imageId: string;
  user: Types.ObjectId;
  usedByCharacter: Types.ObjectId;
  usedPrompt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentDocument extends Document {
  _id: Types.ObjectId;
  character: Types.ObjectId;
  commenter: Types.ObjectId;
  parentComment?: Types.ObjectId | null;
  text?: string;
  image?: string;
  imageId?: string;
  replies: number;
  likesCount: number;
  likes: Types.ObjectId[];
  reports: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityDocument extends Document {
  _id: Types.ObjectId;
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

export interface SuspensionDocument extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  reason: string;
  suspensionEndDate: Date;
  suspensionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecretCodeDocument extends Document {
  userId: Types.ObjectId;
  code: string;
  createdAt: Date;
}

export type MbtiResult = {
  Fe: Number;
  Fi: Number;
  Te: Number;
  Ti: Number;
  Ne: Number;
  Ni: Number;
  Se: Number;
  Si: Number;
};

export interface PersonalityResultDocument extends Document {
  _id: Types.ObjectId;
  testName: TestName;
  userId: Types.ObjectId;
  mbtiAnalysis: MbtiResult;
  result: string;
  details: string;
}

export interface MeritDocument extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  reports: Types.ObjectId[];
}

export type ReportReasons = {
  offensive: number;
  misinformation: number;
  impersonation: number;
  nsfw: number;
  malicious: number;
  unsafePersonality: number;
};

export interface CharacterReportDocument extends Document {
  _id: Types.ObjectId;
  character: Types.ObjectId;
  disapprovalCount: number;
  reports: Types.ObjectId[];
  reasons: ReportReasons;
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

export interface AuthenticatedSocket extends Socket {
  user?: jwt.JwtPayload;
}

export type NotificationReceiver = {
  receiverUser: Types.ObjectId;
  receiverCharacter?: Types.ObjectId;
};

export type PersonalityTraits = {
  mbti?: MbtiType;
  enneagram?: EnneagramType;
  attachmentStyle?: AttachmentType;
  zodiac?: Zodiac;
};

export type ChatData = {
  text: string;
  llmModel: LlmModel;
  characterName: string;
  gender: CharacterGender;
  personality: string;
  opening?: string;
  responseStyle: ResponseStyle;
  mbti?: MbtiType;
  enneagram?: EnneagramType;
  attachmentStyle?: AttachmentType;
  zodiac?: Zodiac;
  chatHistory?: MessageDocument[];
  memory?: string;
};

export type UserModerationResult = {
  success: boolean;
  statusCode: 200 | 400 | 500;
  status: 'allowed' | 'suspended' | 'banned' | 'activation-error' | 'error';
  message: string;
};

export type CommunicationDependency = {
  genAI: GoogleGenerativeAI;
  openAI: OpenAI;
};

export type CloudinaryDependency = {
  cloudinary: typeof cloudinary;
  deleteTempFile: boolean;
};

export interface CreateReminder extends JobAttributesData {
  userId: string;
  userName: string;
  characterName: string;
  characterId: string;
  userEmail: string;
  message: string;
}

export interface ScheduleNotification extends JobAttributesData {
  text: string;
  image: string;
}

export type CommentData = {
  character: string | Types.ObjectId;
  commenter: Types.ObjectId | string;
  parentComment: Types.ObjectId | string | null;
  text?: string;
  image: string;
  imageId: string;
};
