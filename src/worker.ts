import { initTempCleaner } from './jobs/tempCleaner';

(async function runWorker(): Promise<void> {
  await initTempCleaner();
})();
