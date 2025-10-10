import 'dotenv/config';
import { EnvObject } from '../types/types';
import logger from '../utils/logger';

const _config: EnvObject = {
  PORT: ((process.env.PORT as string) || 3000) as string,
  NODE_ENV: process.env.NODE_ENV as string,
  ALLOWED_ORIGINS: process.env.ORIGIN_URL?.split(',') || [],
  MONGODB_URI: process.env.MONGODB_URI as string,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY as string,
  HUGGING_FACE_TOKEN: process.env.HUGGING_FACE_TOKEN as string,
  GOOGLE_APP_PASSWORD: process.env.GOOGLE_APP_PASSWORD as string,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY as string,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY as string,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY as string,
};

export const config: EnvObject = Object.freeze(_config);

export const checkEnvVariables = function (config: EnvObject): void {
  try {
    for (const [key, value] of Object.entries(config)) {
      if (!value) {
        throw new Error(`Environment variable ${key} is required!`);
      }

      if (typeof value === 'string' && value.trim().length === 0) {
        throw new Error(`Environment variable ${key} is required!`);
      }

      if (Array.isArray(value)) {
        if (value.length === 0 || value.some(v => !v || v.trim().length === 0)) {
          throw new Error(`Environment variable ${key} is empty!`);
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Environment variable check failed: ${error.message}`);
    }
    process.exit(1);
  }
};
