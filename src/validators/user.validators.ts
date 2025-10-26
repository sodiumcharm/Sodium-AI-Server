import { z } from 'zod';

export const usernameSchema = z.object({
  username: z
    .string({ error: 'Empty or invalid input type was provided for username!' })
    .trim()
    .min(3, { message: 'Username must be at least 3 characters long!' })
    .max(20, { message: 'Username must be at most 20 characters long!' })
    .regex(/^[a-zA-Z_-]/, {
      message: 'Username must start with a letter, underscore, or hyphen!',
    })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: 'Username can only contain letters, numbers, underscores, and hyphens!',
    }),
});

export const fullnameSchema = z.object({
  fullname: z
    .string({ error: 'Empty or invalid input type was provided for fullname!' })
    .trim()
    .min(2, { message: 'Fullname must be at least 2 characters long!' })
    .max(50, { message: 'Fullname must be at most 50 characters long!' })
    .regex(/^[a-zA-Z\s]+$/, {
      message: 'Fullname can only contain letters and spaces!',
    }),
});

export const resetPasswordSchema = z.object({
  secretCode: z
    .string({ error: 'Empty or invalid input type was provided for Secret code!' })
    .trim()
    .length(15, { message: 'Invalid code length detected!' })
    .regex(/^[a-zA-Z0-9]{15}$/, {
      message: 'Code must contain only letters and numbers',
    }),
  newPassword: z
    .string({ error: 'Empty or invalid input type was provided for password!' })
    .min(8, { message: 'Password must be at least 8 characters long!' })
    .max(128, { message: 'Password must be at most 128 characters long!' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/, {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one symbol!',
    }),
  email: z
    .string({ error: 'Empty or invalid input type was provided for email!' })
    .toLowerCase()
    .trim()
    .email({ message: 'Please provide a valid email address!' }),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ error: 'Empty or invalid input type was provided for current password!' })
    .min(8, { message: 'Current password must be at least 8 characters long!' })
    .max(128, { message: 'Current password must be at most 128 characters long!' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/, {
      message:
        'Current password must contain at least one uppercase letter, one lowercase letter, one digit, and one symbol!',
    }),
  newPassword: z
    .string({ error: 'Empty or invalid input type was provided for new password!' })
    .min(8, { message: 'New password must be at least 8 characters long!' })
    .max(128, { message: 'New password must be at most 128 characters long!' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/, {
      message:
        'New password must contain at least one uppercase letter, one lowercase letter, one digit, and one symbol!',
    }),
});

export const changeProfileImageSchema = z.object({
  deleteImage: z
    .enum(['true', 'false'], {
      message: 'deleteImage must be either true or false!',
    })
    .default('false'),
});

export const profileDescriptionSchema = z.object({
  profileDescription: z
    .string({ error: 'Empty or invalid input type was provided for profile description!' })
    .trim()
    .max(200, { message: 'Maximum allowed description length is 200 characters!' }),
});

export const userPersonalitySchema = z
  .object({
    personality: z
      .string({ error: 'Invalid input type was provided for personality!' })
      .trim()
      .max(500, { message: 'Maximum allowed personality description length is 500 characters!' })
      .optional(),
    gender: z
      .enum(['male', 'female', 'unknown'], {
        message: 'Gender must be either male, female, or unknown!',
      })
      .default('unknown'),
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
  })
  .strip();

export const getUsersSchema = z.object({
  type: z.enum(['subscribers', 'subscribing'], {
    message: 'User type can be either subscribers or subscribing users!',
  }),
  page: z
    .string({ error: 'Page number is required!' })
    .regex(/^\d+$/, { message: 'Value must be a number!' })
    .transform(val => Number(val)),
});
