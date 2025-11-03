import multer, { StorageEngine } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  MAX_CHARACTER_DATA_SIZE,
  MAX_USER_IMAGE_SIZE,
  MAX_REF_IMAGE_SIZE,
  MAX_COMMENT_IMAGE_SIZE,
} from '../constants';
import { characterDataFilter, imageFilter } from '../config/multerFilters';

const diskStorage: StorageEngine = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const memoryStorage: StorageEngine = multer.memoryStorage();

export const uploadUserImage = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_USER_IMAGE_SIZE },
  fileFilter: imageFilter,
});

export const uploadCharacterData = multer({
  storage: diskStorage,
  limits: { fileSize: MAX_CHARACTER_DATA_SIZE },
  fileFilter: characterDataFilter,
});

export const uploadReferenceImage = multer({
  storage: diskStorage,
  limits: { fileSize: MAX_REF_IMAGE_SIZE },
  fileFilter: imageFilter,
});

export const uploadCommentImage = multer({
  storage: diskStorage,
  limits: { fileSize: MAX_COMMENT_IMAGE_SIZE },
  fileFilter: imageFilter,
});
