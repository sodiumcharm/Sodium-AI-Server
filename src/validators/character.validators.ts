import { z } from 'zod';

export const createCharacterSchema = z
  .object({
    name: z
      .string({ error: 'Character name must be a string!' })
      .trim()
      .min(1, { message: 'Character name is required!' })
      .max(50, { message: 'Character name must be at most 50 characters long!' })
      .regex(/^[\p{L}\p{M}\s]+$/u, {
        message: 'Character name cannot contain special characters!',
      }),
    gender: z
      .enum(['male', 'female', 'non-binary'], {
        message: 'Gender must be either male, female, or non-binary!',
      })
      .default('non-binary'),
    description: z
      .string({ error: 'Character description must be a string!' })
      .trim()
      .min(1, { message: 'Character description is required!' })
      .max(500, { message: 'Character description must be at most 500 characters long!' }),
    relationship: z
      .string({ error: 'Empty or invalid input type was provided for relationship!' })
      .trim()
      .min(1, { message: 'Character relationship is required!' })
      .max(100, { message: 'Character relationship must be at most 100 characters long!' }),
    responseStyle: z
      .enum(['role-play', 'professional'], {
        message: 'Response style must be either role-play or professional!',
      })
      .default('role-play'),
    imageId: z
      .string({ error: 'Empty or invalid input type was provided for creator!' })
      .trim()
      .regex(/^[a-f\d]{24}$/i, { message: 'Invalid image id provided!' })
      .optional(),
    personality: z
      .string({ error: 'Empty or invalid input type was provided for personality!' })
      .trim()
      .min(20, { message: 'Character personality must be at least 20 characters long!' })
      .max(5000, { message: 'Character personality must be at most 5000 characters long!' }),
    mbti: z
      .enum(
        [
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
        {
          message: 'MBTI must be a valid MBTI type!',
        }
      )
      .optional(),
    enneagram: z
      .enum(['1', '2', '3', '4', '5', '6', '7', '8', '9'], {
        message: 'Enneagram must be a valid enneagram type!',
      })
      .optional(),
    attachmentStyle: z
      .enum(['secure', 'anxious', 'avoidant', 'disorganised'], {
        message: 'Attachment style must be either secure, anxious, avoidant, or disorganised!',
      })
      .optional(),
    zodiac: z
      .enum(
        [
          'aries',
          'taurus',
          'gemini',
          'cancer',
          'leo',
          'virgo',
          'libra',
          'scorpio',
          'sagittarius',
          'capricorn',
          'aquarius',
          'pisces',
        ],
        {
          message: 'Zodiac must be a valid zodiac type!',
        }
      )
      .optional(),
    voice: z
      .string({ error: 'Empty or invalid input type was provided for voice!' })
      .trim()
      .min(1, { message: 'Character voice is required!' })
      .max(50, { message: 'Character voice must be at most 50 characters long!' }),
    opening: z
      .string({ error: 'Empty or invalid input type was provided for opening!' })
      .trim()
      .min(2, { message: 'Character opening must be at least 2 characters long!' })
      .max(1000, { message: 'Character opening must be at most 1000 characters long!' }),
    llmModel: z
      .enum(
        [
          'gemini-2.5-flash',
          'gemini-2.5-pro',
          'gemini-2.5-flash-lite',
          'gemini-2.0-flash',
          'gemini-2.0-flash-lite',
          'gpt-5',
          'gpt-5-turbo',
          'gpt-5-32k',
          'gpt-4',
          'gpt-4-turbo',
          'gpt-4o',
          'gpt-4o-mini',
          'gpt-3.5-turbo',
        ],
        {
          message: 'Please provide a valid LLM model!',
        }
      )
      .default('gemini-2.0-flash'),
    tags: z.string({ error: 'Invalid input type was provided for tags!' }).trim().optional(),
    visibility: z
      .enum(['public', 'private'], {
        message: 'Visibility must be either public or private!',
      })
      .default('public'),
  })
  .strip();

export const characterCommunicationSchema = z.object({
  characterId: z
    .string({ error: 'Empty or invalid input type was provided for character!' })
    .trim()
    .regex(/^[a-f\d]{24}$/i, { message: 'Invalid character id provided!' }),
  text: z
    .string({ error: 'Invalid input type was provided for text!' })
    .trim()
    .min(1, { message: 'Text is required!' })
    .max(1000, { message: 'Text must be at most 1000 characters long!' }),
});

export const editCharacterSchema = z
  .object({
    characterId: z
      .string({ error: 'Invalid input type was provided for character!' })
      .trim()
      .regex(/^[a-f\d]{24}$/i, { message: 'Invalid character id provided!' }),
    name: z
      .string({ error: 'Character name must be a string!' })
      .trim()
      .min(1, { message: 'Character name is required!' })
      .max(50, { message: 'Character name must be at most 50 characters long!' })
      .regex(/^[\p{L}\p{M}\s]+$/u, {
        message: 'Character name cannot contain special characters!',
      })
      .optional(),
    description: z
      .string({ error: 'Character description must be a string!' })
      .trim()
      .min(1, { message: 'Character description is required!' })
      .max(500, { message: 'Character description must be at most 500 characters long!' })
      .optional(),
    relationship: z
      .string({ error: 'Empty or invalid input type was provided for relationship!' })
      .trim()
      .min(1, { message: 'Character relationship is required!' })
      .max(100, { message: 'Character relationship must be at most 100 characters long!' })
      .optional(),
    responseStyle: z
      .enum(['role-play', 'professional'], {
        message: 'Response style must be either role-play or professional!',
      })
      .default('role-play')
      .optional(),
    imageId: z
      .string({ error: 'Empty or invalid input type was provided for creator!' })
      .trim()
      .regex(/^[a-f\d]{24}$/i, { message: 'Invalid image id provided!' })
      .optional(),
    personality: z
      .string({ error: 'Empty or invalid input type was provided for personality!' })
      .trim()
      .min(20, { message: 'Character personality must be at least 20 characters long!' })
      .max(5000, { message: 'Character personality must be at most 5000 characters long!' })
      .optional(),
    mbti: z
      .enum(
        [
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
        {
          message: 'MBTI must be a valid MBTI type!',
        }
      )
      .optional(),
    enneagram: z
      .enum(['1', '2', '3', '4', '5', '6', '7', '8', '9'], {
        message: 'Enneagram must be a valid enneagram type!',
      })
      .optional(),
    attachmentStyle: z
      .enum(['secure', 'anxious', 'avoidant', 'disorganised'], {
        message: 'Attachment style must be either secure, anxious, avoidant, or disorganised!',
      })
      .optional(),
    zodiac: z
      .enum(
        [
          'aries',
          'taurus',
          'gemini',
          'cancer',
          'leo',
          'virgo',
          'libra',
          'scorpio',
          'sagittarius',
          'capricorn',
          'aquarius',
          'pisces',
        ],
        {
          message: 'Zodiac must be a valid zodiac type!',
        }
      )
      .optional(),
    voice: z
      .string({ error: 'Empty or invalid input type was provided for voice!' })
      .trim()
      .min(1, { message: 'Character voice is required!' })
      .max(50, { message: 'Character voice must be at most 50 characters long!' })
      .optional(),
    opening: z
      .string({ error: 'Empty or invalid input type was provided for opening!' })
      .trim()
      .min(2, { message: 'Character opening must be at least 2 characters long!' })
      .max(1000, { message: 'Character opening must be at most 1000 characters long!' })
      .optional(),
    llmModel: z
      .enum(
        [
          'gemini-2.5-flash',
          'gemini-2.5-pro',
          'gemini-2.5-flash-lite',
          'gemini-2.0-flash',
          'gemini-2.0-flash-lite',
          'gpt-5',
          'gpt-5-turbo',
          'gpt-5-32k',
          'gpt-4',
          'gpt-4-turbo',
          'gpt-4o',
          'gpt-4o-mini',
          'gpt-3.5-turbo',
        ],
        {
          message: 'Please provide a valid LLM model!',
        }
      )
      .optional(),
    tags: z.string({ error: 'Invalid input type was provided for tags!' }).trim().optional(),
    visibility: z
      .enum(['public', 'private'], {
        message: 'Visibility must be either public or private!',
      })
      .optional(),
  })
  .strip();

export const removeMediaSchema = z.object({
  characterId: z
    .string({ error: 'Empty or invalid input type was provided for character!' })
    .trim()
    .regex(/^[a-f\d]{24}$/i, { message: 'Invalid character id provided!' }),
  target: z.enum(['avatar', 'music'], {
    message: 'Target must be either avatar or music!',
  }),
});

export const getCharactersOptionSchema = z.enum(
  [
    'random',
    'all',
    'recent',
    'most-followed',
    'emotional',
    'wholesome',
    'animal',
    'object',
    'romantic',
    'adventure',
    'action',
    'sci-fi',
    'historical',
    'friendship',
    'family',
    'horror',
    'mythology',
    'gaming',
    'educational',
    'psychology',
    'highschool',
    'college',
    'fantasy',
  ],
  { message: 'Please provide a valid option for finding characters' }
);
