import multer, { StorageEngine } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MAX_CHARACTER_IMAGE_SIZE, MAX_USER_IMAGE_SIZE } from '../constants';
import { imageFilter } from '../config/multerFilters';

const storage: StorageEngine = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

export const uploadUserImage = multer({
  storage,
  limits: { fileSize: MAX_USER_IMAGE_SIZE },
  fileFilter: imageFilter,
});

export const uploadCharacterImage = multer({
  storage,
  limits: { fileSize: MAX_CHARACTER_IMAGE_SIZE },
  fileFilter: imageFilter,
});
