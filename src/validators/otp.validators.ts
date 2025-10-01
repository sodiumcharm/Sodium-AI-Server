import { z } from 'zod';

export const otpRequestSchema = z.object({
  email: z
    .string({ error: 'Empty or invalid input type was provided for email!' })
    .trim()
    .toLowerCase()
    .email({ message: 'Please provide a valid email address!' })
    .optional(),
  context: z.enum(['2FA', 'verify-email', 'forgot-password'], {
    message: 'Context must be either 2FA, verify-email or forgot-password!',
  }),
});

export const otpVerificationSchema = z.object({
  userId: z
    .string({ error: 'Empty or invalid input type was provided for userId!' })
    .trim()
    .regex(/^[a-f\d]{24}$/i, { message: 'Inavlid user id provided!' }),
  otp: z
    .string({ error: 'Empty or invalid input type was provided for OTP!' })
    .trim()
    .length(6, { message: 'OTP must be exactly 6 characters!' })
    .regex(/^\d{6}$/, { message: 'OTP must contain digits only!' }),
  context: z
    .enum(['2FA', 'verify-email', 'forgot-password'], {
      message: 'Context must be either 2FA, verify-email or forgot-password!',
    })
    .optional(),
});
