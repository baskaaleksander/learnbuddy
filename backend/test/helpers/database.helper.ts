import { db } from '../setup-e2e';
import * as schema from '../../src/database/schema';

export async function createTestMaterial(userId: string) {
  const material = {
    title: 'Test Material',
    description: 'A test material for E2E testing',
    content: 'example.com',
    status: 'processed' as const,
    userId,
  };

  const [createdMaterial] = await db
    .insert(schema.materials)
    .values(material)
    .returning();
  return createdMaterial;
}
