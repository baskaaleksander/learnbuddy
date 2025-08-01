import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { cleanupTestDatabase, setupTestDatabase } from '../test/setup-e2e';
import { createUserAndLogin } from './helpers/auth.helper';
import { createTestMaterial } from './helpers/database.helper';

describe('Quiz (e2e)', () => {
  let app: INestApplication;
  let dbHelper: any;
  let testUser: any;
  let testMaterial: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );

    app.enableCors({
      origin: '*',
      credentials: true,
    });

    app.use(cookieParser());

    await app.init();

    dbHelper = await setupTestDatabase();
    testUser = await createUserAndLogin(app);
    testMaterial = await createTestMaterial(testUser.user.id);
  });

  describe('Quiz Creation', () => {
    it('should create a quiz for a material', async () => {
      const createQuizMutation = `
        mutation CreateQuiz {
            createQuiz(materialId: "${testMaterial.id}")
        }
    `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .send({ query: createQuizMutation })
        .expect(200);

      console.log(response.body);
      expect(response.body.data.createQuiz).toBeDefined();
      expect(response.body.errors).toBeUndefined();
    });
    it('should not create a quiz for a non-existent material', async () => {
      const createQuizMutation = `
        mutation CreateQuiz {
            createQuiz(materialId: "non-existent-material-id")
        }
    `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .send({ query: createQuizMutation });

      expect(response.body.errors).toBeDefined();
      expect(response.body.data).toBeNull();
    });

    it('should not create a quiz without authentication', async () => {
      const createQuizMutation = `
        mutation CreateQuiz {
            createQuiz(materialId: "${testMaterial.id}")
        }
    `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createQuizMutation });

      expect(response.body.errors).toBeDefined();
      expect(response.body.data).toBeNull();
    });

    it('should not create a quiz for a material that does not belong to the user', async () => {
      const otherUser = await createUserAndLogin(app);
      const otherMaterial = await createTestMaterial(otherUser.user.id);

      const createQuizMutation = `
        mutation CreateQuiz {
            createQuiz(materialId: "${otherMaterial.id}")
        }
    `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .send({ query: createQuizMutation });

      expect(response.body.errors).toBeDefined();
      expect(response.body.data).toBeNull();
    });

    it.todo('should create quiz with proper question structure and options');
    it.todo('should handle quiz creation when AI service is unavailable');
    it.todo('should not create duplicate quiz for same material');
    it.todo('should respect user token limits when creating quiz');
  });

  describe('Quiz Submission', () => {
    it.todo('should submit a quiz answers');
    it.todo('should save quiz partial progress if quiz not completed');
    it.todo('should not submit a quiz answers for a non-existent quiz');
    it.todo('should not submit a quiz answers without authentication');
    it.todo(
      'should not submit a quiz answer for a quiz that does not belong to the user',
    );
    it.todo('should calculate correct score based on answers');
    it.todo('should handle submission after time limit expires');
    it.todo('should prevent multiple submissions for same quiz');
    it.todo('should validate answer format before submission');
    it.todo('should record time spent on each question');
  });

  describe('Quiz Retrieval', () => {
    it.todo('should retrieve a quiz by ID');
    it.todo('should retrieve quiz partial to continue quiz');
    it.todo('should not retrieve a quiz for a non-existent quiz');
    it.todo('should not retrieve a quiz without authentication');
    it.todo(
      'should not retrieve a quiz for a quiz that does not belong to the user',
    );
    it.todo('should hide correct answers when retrieving active quiz');
    it.todo('should show correct answers and explanations after completion');
    it.todo('should retrieve quiz with user progress included');
    it.todo('should handle concurrent quiz access properly');
  });

  describe('Quiz Deletion', () => {
    it.todo('should delete a quiz');
    it.todo('should not delete a quiz for a non-existent quiz');
    it.todo('should not delete a quiz without authentication');
    it.todo(
      'should not delete a quiz for a quiz that does not belong to the user',
    );
    it.todo('should cascade delete quiz progress when deleting quiz');
    it.todo('should not delete quiz if user has active session');
  });

  describe('Quiz Progress', () => {
    it.todo('should retrieve quiz progress');
    it.todo('should not retrieve quiz progress for a non-existent quiz');
    it.todo('should not retrieve quiz progress without authentication');
    it.todo(
      'should not retrieve quiz progress for a quiz that does not belong to the user',
    );
    it.todo('should save progress automatically during quiz');
    it.todo('should resume quiz from last saved question');
    it.todo('should clear progress after quiz completion');
    it.todo('should handle progress for timed quizzes');
  });

  describe('Quiz Analytics & Statistics', () => {
    it.todo('should track quiz completion rate');
    it.todo('should calculate average score for quiz');
    it.todo('should identify most missed questions');
    it.todo('should track time spent per question');
    it.todo('should generate quiz performance summary');
  });

  describe('Quiz Content Quality', () => {
    it.todo('should generate minimum number of questions');
    it.todo('should ensure questions have valid multiple choice options');
    it.todo('should include explanations for all answers');
    it.todo('should vary question difficulty levels');
    it.todo('should avoid duplicate questions in same quiz');
  });

  afterAll(async () => {
    await cleanupTestDatabase(dbHelper.db, dbHelper.client);
    await app.close();
  });
});
