import { db } from '../setup-e2e';
import * as schema from '../../src/database/schema';

export async function createTestMaterial(userId: string) {
  const material = {
    title: 'Test Material',
    description: 'A test material for E2E testing',
    content:
      'https://bookify-test.s3.eu-north-1.amazonaws.com/d54c4482-6f5a-4cf1-b0ec-f6756f323eec-hasalove1337%40gmail.com-material-1753123539086.pdf',
    status: 'processed' as const,
    userId,
  };

  const [createdMaterial] = await db
    .insert(schema.materials)
    .values(material)
    .returning();
  return createdMaterial;
}

export async function createTestQuiz(materialId: string, userId: string) {
  const quiz = {
    title: 'Test Quiz',
    type: 'quiz' as const,
    description: 'A test quiz for E2E testing',
    content: 'example.com',
    materialId,
    userId,
  };

  const [createdQuiz] = await db
    .insert(schema.aiOutputs)
    .values(quiz)
    .returning();
  return createdQuiz;
}
