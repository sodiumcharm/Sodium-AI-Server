import mongoose from 'mongoose';
import { DB_NAME } from '../constants';
import logger from '../utils/logger';
import { config } from '../config/config';

export const connectDB = async function (): Promise<void> {
  if (!config.MONGODB_URI || config.MONGODB_URI.trim() === '') {
    throw new Error('MongoDB URI is not defined properly in the configuration!');
  }

  try {
    const connectionInstance = await mongoose.connect(`${config.MONGODB_URI}/${DB_NAME}`);
    logger.info(`MongoDB Connection Successful: ${connectionInstance.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    logger.error(`MongoDB Connection Failure: ${error}`);
  }
};

export const disconnectDB = async function (): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected successfully from your MongoDB Database.');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    logger.error(`MongoDB Disconnection Failure: ${error}`);
  }
};

export const showDBConnectionStatus = function (): void {
  mongoose.connection.on('connected', () => logger.info('Connected to your MongoDB Database.'));
  mongoose.connection.on('disconnected', () =>
    logger.info('Disconnected from your MongoDB Database.')
  );
  mongoose.connection.on('error', err => {
    logger.error(`MongoDB Connection Error: ${err}`);
  });
};
