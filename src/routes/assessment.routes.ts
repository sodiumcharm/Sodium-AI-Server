import { Router } from 'express';
import { verifyAuth, softAuthChecker } from '../middlewares/tokenChecker.middleware';
import { getMBTIResult } from '../controllers/assessment/assessment.controllers';
import { assessmentLimiter } from '../config/expressRateLimit';

const router = Router();

router.route('/mbti').post(verifyAuth, assessmentLimiter, getMBTIResult);

export default router;
