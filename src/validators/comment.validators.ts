import { z } from 'zod';

export const postCommentSchema = z.object({
  characterId: z
    .string({ error: 'Empty or invalid value was provided for character!' })
    .trim()
    .regex(/^[a-f\d]{24}$/i, { message: 'Invalid character id provided!' }),
  parentCommentId: z
    .string({ error: 'Empty or invalid value was provided for comment!' })
    .trim()
    .regex(/^[a-f\d]{24}$/i, { message: 'Invalid comment id provided!' })
    .optional(),
  text: z
    .string({ error: 'Your comment has no text!' })
    .min(1, { message: 'Your comment has no text!' })
    .max(800, { message: 'Comment length cannot exceed 800!' })
    .optional(),
});

export const editCommentSchema = z.object({
  commentId: z
    .string({ error: 'Empty or invalid value was provided for comment!' })
    .trim()
    .regex(/^[a-f\d]{24}$/i, { message: 'Invalid comment id provided!' }),
  text: z
    .string({ error: 'Your comment has no text!' })
    .min(1, { message: 'Your comment has no text!' })
    .max(800, { message: 'Comment length cannot exceed 800!' }),
});

export const getCommentsSchema = z.object({
  characterId: z
    .string({ error: 'Empty or invalid value was provided for character!' })
    .trim()
    .regex(/^[a-f\d]{24}$/i, { message: 'Invalid character id provided!' }),
  page: z
    .string({ error: 'Page number is required!' })
    .regex(/^\d+$/, { message: 'Value must be a number!' })
    .transform(val => Number(val)),
  option: z
    .enum(['recent', 'top', 'all'], {
      message: 'Invalid option provided!',
    })
    .default('all'),
});

export const getRepliesSchema = z.object({
  commentId: z
    .string({ error: 'Empty or invalid value was provided for comment!' })
    .trim()
    .regex(/^[a-f\d]{24}$/i, { message: 'Invalid comment id provided!' }),
  page: z
    .string({ error: 'Page number is required!' })
    .regex(/^\d+$/, { message: 'Value must be a number!' })
    .transform(val => Number(val)),
});
