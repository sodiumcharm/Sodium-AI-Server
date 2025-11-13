import { Router } from 'express';
import { verifyAuth } from '../middlewares/tokenChecker.middleware';
import {
  createMbtiResult,
  createSelfEsteemResult,
  getAssessmentResultDetails,
  getAssessmentResults,
  getMbtiAssessment,
  getSelfEsteemAssessment,
} from '../controllers/assessment/assessment.controllers';
import { assessmentLimiter } from '../config/expressRateLimit';
import { checkEmailVerification } from '../middlewares/emailChecker.middleware';

const router = Router();

router.route('/mbti-questions/:page').get(verifyAuth, checkEmailVerification, getMbtiAssessment);

router.route('/mbti-analyzer').post(verifyAuth, assessmentLimiter, createMbtiResult);

router.route('/assessment-results/:page').get(verifyAuth, getAssessmentResults);

router.route('/get-assessment-details/:resultId').get(verifyAuth, getAssessmentResultDetails);

router
  .route('/self-esteem-questions/:page')
  .get(verifyAuth, checkEmailVerification, getSelfEsteemAssessment);

router.route('/self-esteem-analyzer').post(verifyAuth, assessmentLimiter, createSelfEsteemResult);

export default router;
