import { rateLimit } from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after later!',
  },
});

export default limiter;
