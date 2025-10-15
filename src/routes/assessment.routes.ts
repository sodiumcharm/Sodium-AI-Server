import { Router } from 'express';
import { verifyAuth, softAuthChecker } from '../middlewares/tokenChecker.middleware';
import {
  createMbtiResult,
  getMbtiAssessment,
} from '../controllers/assessment/assessment.controllers';
import { assessmentLimiter } from '../config/expressRateLimit';
import { checkEmailVerification } from '../middlewares/emailChecker.middleware';

const router = Router();

router.route('/mbti-questions/:page').get(verifyAuth, checkEmailVerification, getMbtiAssessment);

router.route('/mbti-analyzer').post(verifyAuth, assessmentLimiter, createMbtiResult);

export default router;
