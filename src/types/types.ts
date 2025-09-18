import { Request, Response, NextFunction } from 'express';

export type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export type EnvObject = {
  PORT: string;
  NODE_ENV: string;
  ALLOWED_ORIGINS: string[];
  MONGODB_URI: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
};

export type CloudinaryDestroyResult = {
  result: 'ok' | 'not found' | 'error';
};

export type MbtiTypes = {
  INTJ: string;
  INTP: string;
  ENTJ: string;
  ENTP: string;
  INFJ: string;
  INFP: string;
  ENFJ: string;
  ENFP: string;
  ISTJ: string;
  ISFJ: string;
  ESTJ: string;
  ESFJ: string;
  ISTP: string;
  ISFP: string;
  ESTP: string;
  ESFP: string;
};
