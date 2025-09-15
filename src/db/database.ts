import mongoose from 'mongoose';
import { DB_NAME } from '../constants';
import logger from '../utils/logger';

export const connectDB = async function (): Promise<void> {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI as string}/${DB_NAME}`
    );
    logger.info(`MongoDB Connection Successful: ${connectionInstance.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB Connection Failure: ${error as Error}`);
    process.exit(1);
  }
};

export const showDBConnectionStatus = function (): void {
  mongoose.connection.on('connected', () =>
    logger.info('Connected to your MongoDB Database.')
  );
  mongoose.connection.on('disconnected', () =>
    logger.info('Disconnected from your MongoDB Database.')
  );
};
