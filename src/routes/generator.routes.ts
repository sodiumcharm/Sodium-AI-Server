import { Router } from 'express';
import { verifyAuth } from '../middlewares/tokenChecker.middleware';
import { checkEmailVerification } from '../middlewares/emailChecker.middleware';
import { imageCheckerAI } from '../middlewares/imageChecker.middleware';
import { generateTextContent } from '../controllers/generators/generator.controllers';

const router = Router();

router.route('/text/:context').get(verifyAuth, checkEmailVerification, generateTextContent);

export default router;
