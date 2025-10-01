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
