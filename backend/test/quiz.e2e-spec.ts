import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { createUserAndLogin } from './helpers/auth.helper';
import { DatabaseHelper } from './helpers/database.helper';

describe('Quiz (e2e)', () => {
  let app: INestApplication;
  let dbHelper: DatabaseHelper;
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

    dbHelper = new DatabaseHelper();
    await dbHelper.setupDatabase();
    testUser = await createUserAndLogin(app);
    testMaterial = await dbHelper.createTestMaterial(testUser.user.id);
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
        .set('Authorization', `Bearer ${testUser.accessToken}`)
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
        .set('Authorization', `Bearer ${testUser.accessToken}`)
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
      const otherMaterial = await dbHelper.createTestMaterial(
        otherUser.user.id,
      );

      const createQuizMutation = `
        mutation CreateQuiz {
            createQuiz(materialId: "${otherMaterial.id}")
        }
    `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: createQuizMutation });

      expect(response.body.errors).toBeDefined();
      expect(response.body.data).toBeNull();
    });

    it('should create quiz with proper question structure and options', async () => {
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      const createQuizMutation = `
        mutation CreateQuiz {
            createQuiz(materialId: "${material.id}")
        }
    `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: createQuizMutation });

      expect(response.body.data.createQuiz).toBeDefined();
      expect(response.body.errors).toBeUndefined();

      const quizId = response.body.data.createQuiz.id;

      const getQuizQuery = `
        query GetQuizzesByMaterial {
            getQuizzesByMaterial(materialId: "${material.id}") {
              id
              materialId
              type
              content
            }
        }
    `;

      const quizResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizQuery });

      expect(quizResponse.body.data.getQuizzesByMaterial).toBeDefined();
      expect(
        quizResponse.body.data.getQuizzesByMaterial.content.length,
      ).toBeGreaterThan(0);
    });
    it('should not create duplicate quiz for same material', async () => {
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      await dbHelper.createTestQuiz(material.id, testUser.user.id);
      const createQuizMutation = `
        mutation CreateQuiz {
            createQuiz(materialId: "${material.id}")
        }
    `;
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: createQuizMutation });

      expect(response.body.errors).toBeDefined();
      expect(response.body.data).toBeNull();
    });
    it('should respect user token limits when creating quiz', async () => {
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      await dbHelper.billTokensForUser(testUser.user.id, 12);

      const createQuizMutation = `
        mutation CreateQuiz {
            createQuiz(materialId: "${material.id}")
        }
    `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: createQuizMutation });

      expect(response.body.data).toBeNull();
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Quiz Submission', () => {
    it('should submit a quiz answers', async () => {
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      await dbHelper.createTestQuiz(material.id, testUser.user.id);

      const getQuizQuery = `
        query GetQuizzesByMaterial {
            getQuizzesByMaterial(materialId: "${material.id}") {
              id
            }
        }
    `;

      const quizResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizQuery });

      const quizId = quizResponse.body.data.getQuizzesByMaterial.id;
      const questionsAndAnswers = [
        {
          question: 1,
          answer: 'Wykazanie umiejętności zdobytych podczas studiów',
        },
        {
          question: 2,
          answer:
            'Ponieważ może to uczynić ją przygodą z wartościowymi wnioskami',
        },
      ];

      const submitQuizMutation = `
        mutation RegisterQuizProgress($quizId: String!, $currentQuestionIndex: Int!, $questionsAndAnswers: [QuestionAndAnswer!]!) {
            registerQuizProgress(
                quizId: $quizId,
                currentQuestionIndex: $currentQuestionIndex,
                questionsAndAnswers: $questionsAndAnswers
            )
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: submitQuizMutation,
          variables: {
            quizId: quizId,
            currentQuestionIndex: 2,
            questionsAndAnswers: questionsAndAnswers,
          },
        });

      expect(response.body.data.registerQuizProgress).toBeDefined();
      expect(response.body.errors).toBeUndefined();
    });
    it('should save quiz partial progress if quiz not completed', async () => {
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      const quiz = await dbHelper.createTestQuiz(material.id, testUser.user.id);

      const getQuizQuery = `
        query GetQuizzesByMaterial {
            getQuizzesByMaterial(materialId: "${material.id}") {
              id
            }
        }
      `;

      const quizResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizQuery });

      const quizId = quizResponse.body.data.getQuizzesByMaterial.id;

      const questionsAndAnswers = [
        {
          question: 1,
          answer: 'Wykazanie umiejętności zdobytych podczas studiów',
        },
      ];

      const submitQuizMutation = `
        mutation RegisterQuizProgress($quizId: String!, $currentQuestionIndex: Int!, $questionsAndAnswers: [QuestionAndAnswer!]!) {
            registerQuizProgress(
                quizId: $quizId,
                currentQuestionIndex: $currentQuestionIndex,
                questionsAndAnswers: $questionsAndAnswers
            )
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: submitQuizMutation,
          variables: {
            quizId: quizId,
            currentQuestionIndex: 1,
            questionsAndAnswers: questionsAndAnswers,
          },
        });

      expect(response.body.data.registerQuizProgress).toBeDefined();
      expect(response.body.errors).toBeUndefined();
    });
    it('should not submit a quiz answers for a non-existent quiz', async () => {
      const questionsAndAnswers = [
        {
          question: 1,
          answer: 'Wykazanie umiejętności zdobytych podczas studiów',
        },
      ];

      const submitQuizMutation = `
        mutation RegisterQuizProgress($quizId: String!, $currentQuestionIndex: Int!, $questionsAndAnswers: [QuestionAndAnswer!]!) {
            registerQuizProgress(
                quizId: $quizId,
                currentQuestionIndex: $currentQuestionIndex,
                questionsAndAnswers: $questionsAndAnswers
            )
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: submitQuizMutation,
          variables: {
            quizId: 'non-existent-quiz-id',
            currentQuestionIndex: 1,
            questionsAndAnswers: questionsAndAnswers,
          },
        });

      const quizResultsQuery = `
        query GetQuizResultsByQuizId {
            getQuizResultsByQuizId(quizId: "non-existent-quiz-id") {
                id
          }`;

      const quizResultsResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: quizResultsQuery });

      expect(quizResultsResponse.body.errors).toBeDefined();
    });
    it('should not submit a quiz answers without authentication', async () => {
      const questionsAndAnswers = [
        {
          question: 1,
          answer: 'Wykazanie umiejętności zdobytych podczas studiów',
        },
      ];

      const submitQuizMutation = `
        mutation RegisterQuizProgress($quizId: String!, $currentQuestionIndex: Int!, $questionsAndAnswers: [QuestionAndAnswer!]!) {
            registerQuizProgress(
                quizId: $quizId,
                currentQuestionIndex: $currentQuestionIndex,
                questionsAndAnswers: $questionsAndAnswers
            )
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: submitQuizMutation,
          variables: {
            quizId: 'non-existent-quiz-id',
            currentQuestionIndex: 1,
            questionsAndAnswers: questionsAndAnswers,
          },
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.data.registerQuizProgress).toBeNull();
    });
    it('should not submit a quiz answer for a quiz that does not belong to the user', async () => {
      const otherUser = await createUserAndLogin(app);
      const material = await dbHelper.createTestMaterial(otherUser.user.id);
      const quiz = await dbHelper.createTestQuiz(
        material.id,
        otherUser.user.id,
      );

      const questionsAndAnswers = [
        {
          question: 1,
          answer: 'Wykazanie umiejętności zdobytych podczas studiów',
        },
      ];

      const submitQuizMutation = `
        mutation RegisterQuizProgress($quizId: String!, $currentQuestionIndex: Int!, $questionsAndAnswers: [QuestionAndAnswer!]!) {
            registerQuizProgress(
                quizId: $quizId,
                currentQuestionIndex: $currentQuestionIndex,
                questionsAndAnswers: $questionsAndAnswers
            )
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: submitQuizMutation,
          variables: {
            quizId: quiz.id,
            currentQuestionIndex: 1,
            questionsAndAnswers: questionsAndAnswers,
          },
        });

      console.log(response.body);

      const quizResultsQuery = `
        query GetQuizResultsByQuizId {
            getQuizResultsByQuizId(quizId: "non-existent-quiz-id") {
                id
          }`;

      const quizResultsResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', otherUser.fullCookie)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({ query: quizResultsQuery });

      expect(quizResultsResponse.body.errors).toBeDefined();
    });
    it('should calculate correct score based on answers');
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

  afterAll(async () => {
    await dbHelper.cleanupTestDatabase();
    await app.close();
  });
});
