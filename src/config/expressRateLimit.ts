import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { config } from '../config/config';

export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later!',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === 'production' ? 5 : 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many attempts, please try again later!',
  },
});

export const otpRequestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1,
  keyGenerator: req => req.body?.context || ipKeyGenerator(req.ip as string),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'You can request a new OTP only once per minute!',
  },
});

export const otpVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many OTP verification requests! Please try again later.',
  },
});

export const assessmentLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 2,
  keyGenerator: req => req.user?.email || ipKeyGenerator(req.ip as string),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'You have exceeded the daily assessment limit! Try again tomorrow.',
  },
});

export const imageGenerationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 50,
  keyGenerator: req => req.user?.email || ipKeyGenerator(req.ip as string),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'You have exceeded the daily image generation limit! Try again tomorrow.',
  },
});

export const commentLimiterPerMinute = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  keyGenerator: req => req.user?.email || ipKeyGenerator(req.ip as string),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'You have posted too many comments, try again later!',
  },
});

export const commentLimiterPerHour = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  keyGenerator: req => req.user?.email || ipKeyGenerator(req.ip as string),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'You have posted too many comments, try again later!',
  },
});
