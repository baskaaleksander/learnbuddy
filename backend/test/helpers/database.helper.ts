import { execSync } from 'child_process';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as postgres from 'postgres';
import * as schema from '../../src/database/schema';

export class DatabaseHelper {
  private readonly TEST_DATABASE_URL;
  private readonly ADMIN_DATABASE_URL;
  public client: postgres.Sql;
  public db: PostgresJsDatabase<typeof schema> & {
    $client: postgres.Sql<any>;
  };

  constructor() {
    this.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
    this.ADMIN_DATABASE_URL = process.env.ADMIN_DATABASE_URL;

    if (!this.ADMIN_DATABASE_URL) {
      throw new Error('ADMIN_DATABASE_URL is not defined');
    }

    if (!this.TEST_DATABASE_URL) {
      throw new Error('TEST_DATABASE_URL is not defined');
    }
    this.client = postgres(this.TEST_DATABASE_URL);
    this.db = drizzle(this.client, { schema });
  }

  private async ensureDatabase() {
    const adminClient = postgres(this.ADMIN_DATABASE_URL);
    const dbName = new URL(this.TEST_DATABASE_URL).pathname.replace('/', '');
    try {
      const isDatabaseExists =
        await adminClient`SELECT 1 FROM pg_database WHERE datname = ${dbName}`;
      if (isDatabaseExists.length === 0) {
        await adminClient`CREATE DATABASE ${dbName}`;
        console.log('Created E2E test database');
      }
      console.log('E2E test database is ready');
    } catch (error) {
      console.error('Error ensuring database:', error);
      throw error;
    }
  }

  public async setupDatabase() {
    try {
      await this.ensureDatabase();

      execSync('npm run db:e2e:setup');

      console.log('Database schema pushed successfully');

      return { db: this.db, client: this.client };
    } catch (error) {
      console.error('Error setting up database:', error);
      throw error;
    }
  }

  public async cleanupTestDatabase() {
    try {
      console.log('Cleaning up test database...');

      await this.db.delete(schema.flashcardProgress);
      await this.db.delete(schema.quizResults);
      await this.db.delete(schema.quizPartials);

      await this.db.delete(schema.flashcards);

      await this.db.delete(schema.aiOutputs);
      await this.db.delete(schema.materials);

      await this.db.delete(schema.subscriptions);

      await this.db.delete(schema.scheduledJobs);

      await this.db.delete(schema.passwordResets);

      await this.db.delete(schema.users);

      await this.db.delete(schema.plans);

      await this.client.end();
      console.log('Test database cleaned up successfully');
    } catch (error) {
      console.error('Failed to cleanup test database:', error);
      try {
        await this.client.end();
      } catch (disconnectError) {
        console.error(
          'Failed to disconnect from database after cleanup error:',
          disconnectError,
        );
      }
      throw error;
    }
  }

  public async getUserData(userId: string) {
    const user = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }

    return user[0];
  }

  public async billTokensForUser(userId: string, tokens: number) {
    const user = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }

    await this.db
      .update(schema.users)
      .set({ tokensUsed: tokens })
      .where(eq(schema.users.id, userId))
      .execute();
  }

  public async createTestMaterial(userId: string) {
    const material = {
      title: 'Test Material',
      description: 'A test material for E2E testing',
      content:
        'https://bookify-test.s3.eu-north-1.amazonaws.com/d54c4482-6f5a-4cf1-b0ec-f6756f323eec-hasalove1337%40gmail.com-material-1753123539086.pdf',
      status: 'processed' as const,
      userId,
    };

    const [createdMaterial] = await this.db
      .insert(schema.materials)
      .values(material)
      .returning();
    return createdMaterial;
  }

  public async createTestQuiz(materialId: string, userId: string) {
    const quizContent = JSON.stringify([
      {
        question:
          'Jakie są główne cele napisania pracy dyplomowej według tekstu?',
        answers: {
          A: 'Zaliczenie przedmiotu z historii literatury',
          B: 'Wykazanie umiejętności zdobytych podczas studiów',
          C: 'Przygotowanie się do egzaminu maturalnego',
        },
        correct_answer: 'B',
      },
      {
        question: 'Dlaczego warto nadać pracy dyplomowej osobisty sens?',
        answers: {
          A: 'Ponieważ uczelnia tego wymaga',
          B: 'Aby szybciej ją ukończyć',
          C: 'Ponieważ może to uczynić ją przygodą z wartościowymi wnioskami',
        },
        correct_answer: 'C',
      },
    ]);
    const quiz = {
      title: 'Test Quiz',
      type: 'quiz' as const,
      description: 'A test quiz for E2E testing',
      content: quizContent,
      materialId,
      userId,
    };

    const [createdQuiz] = await this.db
      .insert(schema.aiOutputs)
      .values(quiz)
      .returning();
    return createdQuiz;
  }

  public async createTestQuizResult(
    quizId: string,
    userId: string,
    materialId: string,
    answers: string,
  ) {
    const quizResult = {
      userId,
      materialId,
      aiOutputId: quizId,
      score: 2,
      totalQuestions: 2,
      answers,
    };

    const [createdQuizResult] = await this.db
      .insert(schema.quizResults)
      .values(quizResult)
      .returning();
    return createdQuizResult;
  }

  public async createTestQuizPartial(quizId: string, userId: string) {
    const answers = JSON.stringify([
      {
        question: 1,
        answer: 'Wykazanie umiejętności zdobytych podczas studiów',
        isCorrect: true,
      },
    ]);
    const quizPartial = {
      userId,
      quizId,
      answers,
      currentQuestionIndex: 1,
      lastUpdated: new Date(),
    };

    const [createdQuizPartial] = await this.db
      .insert(schema.quizPartials)
      .values(quizPartial)
      .returning();
    return createdQuizPartial;
  }

  public async createTestFlashcards(materialId: string, userId: string) {
    const generatedFlashcards = {
      flashcards: [
        {
          id: '36506c90-8914-453d-992e-d1b181790233',
          question: 'What role does sleep play in memory consolidation?',
          answer:
            'Sleep plays a crucial role in memory consolidation by transforming short-term memories into long-term knowledge.',
        },
        {
          id: '9adea952-3c73-4d7f-975d-03163e7758ff',
          question:
            'How does deep sleep benefit learning and recall abilities?',
          answer:
            'During deep sleep, the brain organizes and strengthens new information, improving learning and recall abilities.',
        },
      ],
    };

    const aiOutput = await this.db
      .insert(schema.aiOutputs)
      .values({
        materialId: materialId,
        type: 'flashcards',
        content: { flashcards: generatedFlashcards },
        createdAt: new Date(),
      })
      .returning();

    const dbFlashcards = await Promise.all(
      generatedFlashcards.flashcards.map(async (flashcard) => {
        const inserted = await this.db
          .insert(schema.flashcards)
          .values({
            aiOutputId: aiOutput[0].id,
            question: flashcard.question,
            answer: flashcard.answer,
            createdAt: new Date(),
          })
          .returning();

        return inserted[0];
      }),
    );

    await Promise.all(
      dbFlashcards.map(async (flashcard) => {
        await this.db.insert(schema.flashcardProgress).values({
          flashcardId: flashcard.id,
          userId: userId,
          status: 'review' as const,
        });
      }),
    );

    return aiOutput[0].id;
  }
}
