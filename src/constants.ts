import { ModelMemory } from './types/types';

export const DB_NAME: string = 'SodiumAI';
export const CLIENT_URL: string = '#';
export const API_URL: string = '/api/v1';
export const TEMPFILE_MAX_AGE: number = 1000 * 60 * 10;
export const TEMP_CLEANUP_INTERVAL: number = 1000 * 60 * 15;
export const MAX_CHARACTER_DATA_SIZE: number = 1024 * 1024 * 15;
export const MAX_USER_IMAGE_SIZE: number = 1024 * 1024 * 2.5;
export const MAX_REF_IMAGE_SIZE: number = 1024 * 1024 * 10;
export const ACCESSTOKEN_COOKIE_AGE: number = 1000 * 60 * 60 * 24 * 7;
export const REFRESHTOKEN_COOKIE_AGE: number = 1000 * 60 * 60 * 24 * 30;
export const SERVICE_EMAIL: string = 'sodiumai.service@gmail.com';
export const SMTP_HOST: string = 'smtp.gmail.com';
export const SMTP_PORT: number = 465;
export const SMTP_SECURE: boolean = true;
export const OAUTH_REDIRECT_URL: string = 'http://localhost:8000/api/v1/auth/google/callback';
export const MODEL_MEMORY: ModelMemory = {
  'gemini-2.5-flash': 10,
  'gemini-2.5-pro': 10,
  'gemini-2.5-flash-lite': 10,
  'gemini-2.0-flash': 10,
  'gemini-2.0-flash-lite': 8,
  'gpt-5': 34,
  'gpt-5-turbo': 38,
  'gpt-5-32k': 14,
  'gpt-4': 12,
  'gpt-4-turbo': 10,
  'gpt-4o': 20,
  'gpt-4o-mini': 12,
  'gpt-3.5-turbo': 20,
};
export const IMAGE_MODELS = {
  realistic: 'stabilityai/stable-diffusion-xl-base-1.0',
  anime: 'stabilityai/stable-diffusion-xl-base-1.0',
  fantasy: 'stabilityai/stable-diffusion-xl-base-1.0',
  horror: 'Jonjew/DarkFantasyHorror',
};
