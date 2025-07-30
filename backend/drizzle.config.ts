import * as dotenv from 'dotenv';
dotenv.config();

const isTestEnv = process.env.NODE_ENV === 'test';
const connectionString = isTestEnv
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;

export default {
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
};
