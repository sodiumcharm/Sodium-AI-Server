import { z } from 'zod';

export const mbtiScoreSchema = z
  .object({
    Fe: z
      .number({ error: 'Empty or invalid input type was provided for Fe!' })
      .min(-20, { message: 'Minimum allowed score for a function is -20!' })
      .max(20, { message: 'Maximum allowed score for a function is 20!' }),
    Fi: z
      .number({ error: 'Empty or invalid input type was provided for Fi!' })
      .min(-20, { message: 'Minimum allowed score for a function is -20!' })
      .max(20, { message: 'Maximum allowed score for a function is 20!' }),
    Te: z
      .number({ error: 'Empty or invalid input type was provided for Te!' })
      .min(-20, { message: 'Minimum allowed score for a function is -20!' })
      .max(20, { message: 'Maximum allowed score for a function is 20!' }),
    Ti: z
      .number({ error: 'Empty or invalid input type was provided for Ti!' })
      .min(-20, { message: 'Minimum allowed score for a function is -20!' })
      .max(20, { message: 'Maximum allowed score for a function is 20!' }),
    Ne: z
      .number({ error: 'Empty or invalid input type was provided for Ne!' })
      .min(-20, { message: 'Minimum allowed score for a function is -20!' })
      .max(20, { message: 'Maximum allowed score for a function is 20!' }),
    Ni: z
      .number({ error: 'Empty or invalid input type was provided for Ni!' })
      .min(-20, { message: 'Minimum allowed score for a function is -20!' })
      .max(20, { message: 'Maximum allowed score for a function is 20!' }),
    Se: z
      .number({ error: 'Empty or invalid input type was provided for Se!' })
      .min(-20, { message: 'Minimum allowed score for a function is -20!' })
      .max(20, { message: 'Maximum allowed score for a function is 20!' }),
    Si: z
      .number({ error: 'Empty or invalid input type was provided for Si!' })
      .min(-20, { message: 'Minimum allowed score for a function is -20!' })
      .max(20, { message: 'Maximum allowed score for a function is 20!' }),
  })
  .strip();
