import { Router } from 'express';
import { verifyAuth } from '../middlewares/tokenChecker.middleware';
import { checkEmailVerification } from '../middlewares/emailChecker.middleware';
import { imageCheckerAI } from '../middlewares/imageChecker.middleware';
import {
  createImage,
  deleteImage,
  generateTextContent,
  getImages,
} from '../controllers/generators/generator.controllers';
import { uploadReferenceImage } from '../middlewares/multer.middleware';
import { imageGenerationLimiter } from '../config/expressRateLimit';

const router = Router();

router.route('/my-images/:page').get(verifyAuth, getImages);

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

router.route('/image/delete/:imageId').delete(verifyAuth, deleteImage);

export default router;
