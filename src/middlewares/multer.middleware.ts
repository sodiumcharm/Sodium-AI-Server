import multer, { StorageEngine } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ApiError from '../utils/apiError';
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

export const uploadProfileImage = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 2 },
  fileFilter: imageFilter,
});

export const uploadCharacterImage = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: imageFilter,
});
