import cleanTempFolder from './jobs/tempCleaner';
import { TEMP_CLEANUP_INTERVAL } from './constants';

(async function runWorker(): Promise<void> {
  await cleanTempFolder();
  setInterval(async () => {
    await cleanTempFolder();
  }, TEMP_CLEANUP_INTERVAL);
})();
