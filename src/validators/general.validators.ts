import { z } from 'zod';

export const numericStringSchema = z
  .string({ error: 'Page number is required!' })
  .regex(/^\d+$/, { message: 'Value must be a number!' })
  .transform(val => Number(val));
