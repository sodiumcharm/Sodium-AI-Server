import { Router } from 'express';
import { uploadUserImage } from '../middlewares/multer.middleware';
import { verifyAuth } from '../middlewares/tokenChecker.middleware';
import { checkEmailVerification } from '../middlewares/emailChecker.middleware';
import { toggle2FA, changeUsername, changeFullname } from '../controllers/user/user.controllers';

const router = Router();

router.route('/toggle-2fa').patch(verifyAuth, checkEmailVerification, toggle2FA);

router.route('/change-username').patch(verifyAuth, checkEmailVerification, changeUsername);

router.route('/change-fullname').patch(verifyAuth, changeFullname);

export default router;
