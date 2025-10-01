import { z } from 'zod';

export const loginSchema = z
  .object({
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
      })
      .optional(),
    email: z
      .string({ error: 'Empty or invalid input type was provided for email!' })
      .trim()
      .toLowerCase()
      .email({ message: 'Please provide a valid email address!' })
      .optional(),
    password: z
      .string({ error: 'Empty or invalid input type was provided for password!' })
      .min(8, { message: 'Password must be at least 8 characters long!' })
      .max(128, { message: 'Password must be at most 128 characters long!' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/, {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one symbol!',
      }),
  })
  .refine(data => data.username || data.email, {
    message: 'Please provide either a username or an email address!',
    path: ['username', 'email'],
  });

export const registerSchema = z.object({
  fullname: z
    .string({ error: 'Empty or invalid input type was provided for fullname!' })
    .trim()
    .min(2, { message: 'Fullname must be at least 2 characters long!' })
    .max(50, { message: 'Fullname must be at most 50 characters long!' })
    .regex(/^[a-zA-Z\s]+$/, {
      message: 'Fullname can only contain letters and spaces!',
    }),
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
  email: z
    .string({ error: 'Empty or invalid input type was provided for email!' })
    .toLowerCase()
    .trim()
    .email({ message: 'Please provide a valid email address!' }),
  password: z
    .string({ error: 'Empty or invalid input type was provided for password!' })
    .min(8, { message: 'Password must be at least 8 characters long!' })
    .max(128, { message: 'Password must be at most 128 characters long!' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/, {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one symbol!',
    }),
});
