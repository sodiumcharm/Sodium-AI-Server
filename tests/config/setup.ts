import { beforeAll, afterEach, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { config } from '../../src/config/config';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, { dbName: 'testdb' });
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const collection in collections) {
    await collections[collection].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
