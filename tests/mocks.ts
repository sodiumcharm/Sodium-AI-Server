import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { cloudinary } from '../src/services/cloudinary';

export const mockGenAI = {
  getGenerativeModel: (modelName: string) => ({
    generateContent: async (prompt: string | string[]) => ({
      response: { text: () => `Mocked response for ${prompt}` },
    }),
  }),
} as unknown as GoogleGenerativeAI;

export const mockOpenAI = {
  chat: {
    completions: {
      create: async (options: any) => {
        return {
          choices: [
            {
              message: { content: `Mocked response for the prompt` },
            },
          ],
        };
      },
    },
  },
} as unknown as OpenAI;

export const mockCloudinary = {
  uploader: {
    upload: async (
      filePath: string,
      options?: {
        resource_type?: 'image' | 'video' | 'raw' | 'auto';
        folder?: string;
      }
    ) => {
      return {
        url: `http://mocked.cloudinary.com/${filePath}`,
        secure_url: `https://mocked.cloudinary.com/${filePath}`,
        public_id: `mocked-id-${filePath}`,
      };
    },
    destroy: async (publicId: string, options?: { resource_type: 'image' | 'video' | 'raw' }) => {
      return { result: 'ok' };
    },
  },
} as unknown as typeof cloudinary;
