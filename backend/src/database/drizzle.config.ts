import * as dotenv from 'dotenv';
dotenv.config();

export default {
  schema: './src/database/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
};