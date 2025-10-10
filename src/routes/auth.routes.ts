import { Router } from 'express';
import passport from 'passport';
import { uploadUserImage } from '../middlewares/multer.middleware';
import { imageCheckerAI } from '../middlewares/imageChecker.middleware';
import { processProfileImage } from '../middlewares/imageProcessor.middleware';
import {
  registerUser,
  signInUser,
  signIn2FA,
  signOutUser,
} from '../controllers/auth/auth.controllers';
import { refreshAccess } from '../controllers/auth/refresh.controllers';
import { authLimiter, otpRequestLimiter, otpVerificationLimiter } from '../config/expressRateLimit';
import { verifyAuth } from '../middlewares/tokenChecker.middleware';
import { requestOTP, verifySentOTP } from '../controllers/otp/otp.controllers';
import { oAuthSignIn } from '../controllers/oauth/oauth.controllers';

const router = Router();

router
  .route('/signup')
  .post(
    authLimiter,
    uploadUserImage.single('profileImage'),
    processProfileImage,
    imageCheckerAI,
    registerUser
  );

router.route('/signin').post(authLimiter, signInUser);

router.route('/2fa-signin').post(otpVerificationLimiter, signIn2FA);

router.route('/signout').post(verifyAuth, signOutUser);

router.route('/refresh').post(refreshAccess);

router.route('/authless-otp').post(otpRequestLimiter, requestOTP); // For forgot password reset

router.route('/auth-otp').post(verifyAuth, otpRequestLimiter, requestOTP); // For 2FA and Email verification

router.route('/verify-email-otp').post(verifyAuth, otpVerificationLimiter, verifySentOTP);

router.route('/verify-password-otp').post(otpVerificationLimiter, verifySentOTP);

router
  .route('/google')
  .get(passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));

router
  .route('/google/callback')
  .get(passport.authenticate('google', { session: false }), oAuthSignIn);

export default router;
