import { Router } from 'express';
import { uploadUserImage } from '../middlewares/multer.middleware';
import { verifyAuth } from '../middlewares/tokenChecker.middleware';
import { checkEmailVerification } from '../middlewares/emailChecker.middleware';
import {
  getMyDetails,
  getUserDetails,
  toggle2FA,
  changeUsername,
  changeFullname,
  resetPassword,
  changePassword,
  changeProfileImage,
  setPersonality,
  setDescription,
  subscribe,
  loadUsers,
} from '../controllers/user/user.controllers';
import { imageCheckerAI } from '../middlewares/imageChecker.middleware';
import { processProfileImage } from '../middlewares/imageProcessor.middleware';

const router = Router();

router.route('/me').get(verifyAuth, getMyDetails);

router.route('/user-info/:id').get(getUserDetails);

router.route('/load-users').get(verifyAuth, loadUsers);

router.route('/toggle-2fa').patch(verifyAuth, checkEmailVerification, toggle2FA);

router.route('/change-username').patch(verifyAuth, checkEmailVerification, changeUsername);

router.route('/change-fullname').patch(verifyAuth, changeFullname);

router.route('/reset-password').patch(resetPassword);

router.route('/change-password').patch(verifyAuth, checkEmailVerification, changePassword);

router
  .route('/change-profile-image')
  .patch(
    verifyAuth,
    checkEmailVerification,
    uploadUserImage.single('profileImage'),
    processProfileImage,
    imageCheckerAI,
    changeProfileImage
  );

router.route('/set-description').patch(verifyAuth, checkEmailVerification, setDescription);

router.route('/set-personality').patch(verifyAuth, checkEmailVerification, setPersonality);

router.route('/subscribe/:id').patch(verifyAuth, subscribe);

export default router;
