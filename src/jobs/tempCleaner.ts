import fs from 'fs/promises';
import path from 'path';
import { TEMPFILE_MAX_AGE } from '../constants';
import logger from '../utils/logger';

const TEMP_DIR = path.join(process.cwd(), 'public', 'temp');

const cleanTempFolder = async function (): Promise<void> {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const now = Date.now();

    for (const file of files) {
      if (file === '.gitkeep') continue;

      const filepath = path.join(TEMP_DIR, file);
      const stats = await fs.stat(filepath);
      if (now - stats.mtimeMs > TEMPFILE_MAX_AGE) {
        await fs.unlink(filepath);
        logger.info(`FILE CLEANER: Deleted old residual temp file: ${file}!`);
      }
    }
  } catch (error) {
    logger.error(`FILE CLEANER: Error while cleaning temp folder: ${error}`);
  }
};

export default cleanTempFolder;
