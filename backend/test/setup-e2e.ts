import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
const postgres = require('postgres');
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/database/schema';

process.env.NODE_ENV = 'test';
dotenv.config({ path: '.env.test' });

export const client = postgres(
  process.env.TEST_DATABASE_URL || 'postgres://localhost:5432/learnbuddy_test',
);

export const db = drizzle(client, { schema });

console.log('Starting E2E tests with separate database');

async function ensureE2EDatabase() {
  const adminClient = postgres(
    process.env.TEST_DATABASE_URL || 'postgres://localhost:5432/postgres',
  );

  try {
    await adminClient`CREATE DATABASE learnbuddy_e2e_test`;
    console.log('Created E2E test database');
  } catch (error) {
    console.log('📝 E2E test database already exists or error creating it');
  } finally {
    await adminClient.end();
  }
}

export async function setupTestDatabase() {
  try {
    await ensureE2EDatabase();

    execSync('npm run db:e2e:setup');

    console.log('Database schema pushed successfully');

    return { db, client };
  } catch (error) {
    console.error('Failed to setup test database', error);
    throw error;
  }
}

export async function cleanupTestDatabase(db: any, client: any) {
  try {
    console.log('Cleaning up test database...');

    await db.delete(schema.flashcardProgress);
    await db.delete(schema.quizResults);
    await db.delete(schema.quizPartials);

    await db.delete(schema.flashcards);

    await db.delete(schema.aiOutputs);

    await db.delete(schema.materials);

    await db.delete(schema.subscriptions);

    await db.delete(schema.scheduledJobs);

    await db.delete(schema.passwordResets);

    await db.delete(schema.users);

    await db.delete(schema.plans);

    await client.end();
    console.log('Test database cleaned up successfully');
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
    try {
      await client.end();
    } catch (disconnectError) {
      console.error(
        'Failed to disconnect from database after cleanup error:',
        disconnectError,
      );
    }
    throw error;
  }
}

beforeAll(async () => {
  await ensureE2EDatabase();
});

afterAll(async () => {
  console.log('E2E tests completed');
});
