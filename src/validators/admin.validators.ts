import { z } from 'zod';

export const scheduleNotificationSchema = z.object({
  notifyAt: z.string({ error: 'You did not provide time for notification to emit!' }).trim(),
  message: z
    .string({ error: 'Empty or invalid input type was provided for message!' })
    .trim()
    .min(1, { message: 'Notification text is required!' })
    .max(200, { message: 'Notification text must be at most 200 characters long!' }),
});
