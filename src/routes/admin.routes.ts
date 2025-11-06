import { Router } from 'express';
import { verifyAuth, softAuthChecker } from '../middlewares/tokenChecker.middleware';
import { allowAdminOnly } from '../middlewares/allowAdminOnly.middleware';
import { scheduleNotification } from '../controllers/admin/admin.controllers';
import { processImage } from '../middlewares/imageProcessor.middleware';
import { uploadNotificationImage } from '../middlewares/multer.middleware';

const router = Router();

router
  .route('/schedule-notification')
  .post(
    verifyAuth,
    allowAdminOnly,
    uploadNotificationImage.single('notificationImage'),
    processImage,
    scheduleNotification
  );

export default router;
