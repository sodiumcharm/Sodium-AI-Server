import { Router } from 'express';
import { uploadCharacterData } from '../middlewares/multer.middleware';
import { verifyAuth, softAuthChecker } from '../middlewares/tokenChecker.middleware';
import { checkEmailVerification } from '../middlewares/emailChecker.middleware';
import { imageCheckerAI } from '../middlewares/imageChecker.middleware';
import {
  clearCommunicationMemory,
  communicateCharacter,
  createCharacter,
  deleteMedia,
  dropCharacter,
  editCharacter,
  followCharacter,
  getCharacters,
  getPossibleReplies,
} from '../controllers/character/character.controllers';

const router = Router();

router.route('/get-characters').get(softAuthChecker, getCharacters);

router.route('/create').post(
  verifyAuth,
  checkEmailVerification,
  uploadCharacterData.fields([
    { name: 'characterImage', maxCount: 1 },
    { name: 'characterAvatar', maxCount: 1 },
    { name: 'music', maxCount: 1 },
  ]),
  imageCheckerAI,
  createCharacter
);

router.route('/communicate').post(softAuthChecker, communicateCharacter);

router.route('/generate-replies/:characterId').get(verifyAuth, getPossibleReplies);

router.route('/follow/:characterId').patch(verifyAuth, checkEmailVerification, followCharacter);

router.route('/clear-memory/:characterId').patch(softAuthChecker, clearCommunicationMemory);

router.route('/edit').patch(
  verifyAuth,
  uploadCharacterData.fields([
    { name: 'characterImage', maxCount: 1 },
    { name: 'characterAvatar', maxCount: 1 },
    { name: 'music', maxCount: 1 },
  ]),
  imageCheckerAI,
  editCharacter
);

router.route('/remove').delete(verifyAuth, deleteMedia);

router.route('/drop/:characterId').delete(verifyAuth, dropCharacter);

export default router;
