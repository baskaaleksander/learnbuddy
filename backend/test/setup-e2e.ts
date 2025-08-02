import * as dotenv from 'dotenv';
import { DatabaseHelper } from './helpers/database.helper';

process.env.NODE_ENV = 'test';
dotenv.config({ path: '.env.test' });

const databaseHelper = new DatabaseHelper();

beforeAll(async () => {
  await databaseHelper.setupDatabase();
});

afterAll(async () => {
  await databaseHelper.cleanupTestDatabase();
  console.log('E2E tests completed');
});
