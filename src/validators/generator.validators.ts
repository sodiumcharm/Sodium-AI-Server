import { z } from 'zod';

export const imageGenerationSchema = z.object({
  prompt: z
    .string({ error: 'Empty or invalid data provided for prompt!' })
    .trim()
    .min(3, { message: 'Prompt must be at least 3 characters long!' })
    .max(500, { message: 'Prompt must be at most 500 characters long!' })
    .optional(),
  style: z.enum(['realistic', 'anime', 'fantasy', 'horror'], {
    message: 'Style must be realistic, anime, fantasy or horror!',
  }),
});
