import { config, checkEnvVariables } from './config/config';
import { Server } from 'http';
import logger from './utils/logger';
import app from './app';
import { connectDB, showDBConnectionStatus, disconnectDB } from './services/mongoose';
import cleanTempFolder from './jobs/tempCleaner';
import { TEMP_CLEANUP_INTERVAL } from './constants';

// Checking environment variables
checkEnvVariables(config);

let server: Server | null = null;

// Error Handling
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception! Shutting down...');
  logger.error({ name: err.name, message: err.message });
  process.exit(1);
});

process.on('unhandledRejection', async (err: Error) => {
  try {
    logger.info('Unhandled Rejection! Server Shutting Down...');
    logger.error({ name: err.name, message: err.message });

    // Disconnect from DB
    await disconnectDB();

    // Close server if it was initiated
    if (!server) process.exit(1);

    server.close(() => {
      process.exit(1);
    });
  } catch (error) {
    logger.error(`Error during server shutting down: ${error}`);
    process.exit(1);
  }
});

// Display MongoDB Connection status
showDBConnectionStatus();

// Connect to Database
connectDB()
  .then(() => {
    server = app.listen(config.PORT, () => {
      logger.info(`Server is running on port ${config.PORT}`);
    });
  })
  .catch(error => {
    logger.error(`MongoDB Connection Failure: ${error}`);
    process.exit(1);
  });

// Auto-cleanup of old residual files from temp folder
(async function (): Promise<void> {
  await cleanTempFolder();
  setInterval(async () => {
    await cleanTempFolder();
  }, TEMP_CLEANUP_INTERVAL);
})();
