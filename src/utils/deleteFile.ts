import fs from 'fs/promises';
import logger from '../utils/logger';

const safelyDeleteFile = async function (path: string): Promise<void> {
  try {
    await fs.unlink(path);
  } catch (error) {
    logger.error(`Error deleting file ${path}: ${error}`);
  }
};

export default safelyDeleteFile;
