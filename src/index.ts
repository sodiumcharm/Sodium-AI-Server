import 'dotenv/config';
import http from 'http';
import logger from './utils/logger';

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception! Shutting down...');
  logger.error({ name: err.name, message: err.message }, 'ERROR: Something went wrong!');
  process.exit(1);
});

import app from './app';
import { connectDB, showDBConnectionStatus } from './db/database';

const port: number = Number(process.env.PORT as string || 3000);

let server: http.Server;

connectDB().then(() => {
  server = app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
}).catch((error: Error) => {
  logger.error(`MongoDB Connection Failure: ${error}`);
  process.exit(1);
});

showDBConnectionStatus();

process.on('unhandledRejection', (err: Error) => {
  console.log('Unhandled Rejection! Shutting down...');
  logger.error({ name: err.name, message: err.message });
  server.close(() => {
    process.exit(1);
  });
});
