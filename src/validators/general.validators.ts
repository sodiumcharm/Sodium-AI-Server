import { z } from 'zod';

export const numericStringSchema = z
  .string({ error: 'Page number is required!' })
  .regex(/^\d+$/, { message: 'Value must be a number!' })
  .transform(val => Number(val));

export const objectIdSchema = z
  .string({ error: 'Invalid id provided!' })
  .trim()
  .regex(/^[a-f\d]{24}$/i, { message: 'Invalid id provided!' });
