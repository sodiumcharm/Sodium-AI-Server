import { Router } from 'express';
import { uploadCharacterData } from '../middlewares/multer.middleware';
import { verifyAuth } from '../middlewares/tokenChecker.middleware';
import { imageCheckerAI } from '../middlewares/imageChecker.middleware';
import { createDraft, editDraft, publishDraft } from '../controllers/draft/draft.controllers';
import { checkEmailVerification } from '../middlewares/emailChecker.middleware';

const router = Router();

router.route('/create').post(
  verifyAuth,
  uploadCharacterData.fields([
    { name: 'characterImage', maxCount: 1 },
    { name: 'characterAvatar', maxCount: 1 },
    { name: 'music', maxCount: 1 },
  ]),
  imageCheckerAI,
  createDraft
);

router.route('/edit').patch(
  verifyAuth,
  uploadCharacterData.fields([
    { name: 'characterImage', maxCount: 1 },
    { name: 'characterAvatar', maxCount: 1 },
    { name: 'music', maxCount: 1 },
  ]),
  imageCheckerAI,
  editDraft
);

router.route('/publish/:draftId').post(verifyAuth, checkEmailVerification, publishDraft);

export default router;
