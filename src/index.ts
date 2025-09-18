import { config, checkEnvVariables } from './config/config';
import http from 'http';
import logger from './utils/logger';

checkEnvVariables(config);

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception! Shutting down...');
  logger.error({ name: err.name, message: err.message });
  process.exit(1);
});

import app from './app';
import { connectDB, showDBConnectionStatus, disconnectDB } from './services/mongoose';

let server: http.Server;

showDBConnectionStatus();

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

process.on('unhandledRejection', async (err: Error) => {
  try {
    logger.info('Unhandled Rejection! Server Shutting Down...');
    logger.error({ name: err.name, message: err.message });
    await disconnectDB();
    server.close(() => {
      process.exit(1);
    });
  } catch (error) {
    logger.error(`Error during server shutting down: ${error}`);
  }
});
