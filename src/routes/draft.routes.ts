import { Router } from 'express';
import { uploadCharacterData } from '../middlewares/multer.middleware';
import { verifyAuth } from '../middlewares/tokenChecker.middleware';
import { imageCheckerAI } from '../middlewares/imageChecker.middleware';
import {
  createDraft,
  deleteDraft,
  deleteDraftMedia,
  editDraft,
  getDraftInfo,
  loadDrafts,
  publishDraft,
} from '../controllers/draft/draft.controllers';
import { checkEmailVerification } from '../middlewares/emailChecker.middleware';

const router = Router();

router.route('/load-drafts').get(verifyAuth, loadDrafts);

router.route('/get-info/:draftId').get(verifyAuth, getDraftInfo);

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

router.route('/delete/:draftId').delete(verifyAuth, deleteDraft);

router.route('/delete-media').patch(verifyAuth, deleteDraftMedia);

export default router;
