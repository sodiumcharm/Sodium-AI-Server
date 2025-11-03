import { config, checkEnvVariables } from './config/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import corsOptions from './config/cors';
import logger from './utils/logger';
import { connectDB, showDBConnectionStatus, disconnectDB } from './services/mongoose';
import { initTempCleaner } from './jobs/tempCleaner';
import { initSockets } from './websocket/socket';
import agenda from './jobs/agenda';

// Checking environment variables
checkEnvVariables(config);

// Initiating Server
const server = http.createServer(app);

// Initialize Sockets
const io = new SocketIOServer(server, {
  cors: corsOptions,
});

initSockets(io);

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

    await agenda.drain();

    server.close(() => process.exit(1));
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
    server.listen(config.PORT, async () => {
      logger.info(`Server is running on port ${config.PORT}`);
      await agenda.start();
      logger.info('Agenda started and is ready to process jobs.');
      await initTempCleaner();
    });
  })
  .catch(error => {
    logger.error(`MongoDB Connection Failure: ${error}`);
    process.exit(1);
  });
