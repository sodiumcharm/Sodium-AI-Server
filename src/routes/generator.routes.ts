import { Router } from 'express';
import { verifyAuth } from '../middlewares/tokenChecker.middleware';
import { checkEmailVerification } from '../middlewares/emailChecker.middleware';
import { imageCheckerAI } from '../middlewares/imageChecker.middleware';
import { createImage, generateTextContent } from '../controllers/generators/generator.controllers';
import { uploadReferenceImage } from '../middlewares/multer.middleware';
import { imageGenerationLimiter } from '../config/expressRateLimit';

const router = Router();

router.route('/text/:context').get(verifyAuth, checkEmailVerification, generateTextContent);

router
  .route('/image')
  .post(
    verifyAuth,
    checkEmailVerification,
    imageGenerationLimiter,
    uploadReferenceImage.single('referenceImage'),
    imageCheckerAI,
    createImage
  );

export default router;
