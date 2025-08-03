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

      await request(app.getHttpServer())
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
    it('should calculate correct score based on answers', async () => {
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

      await request(app.getHttpServer())
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

      const quizResultsQuery = `
        query GetQuizResultByQuizId {
            getQuizResultByQuizId(id: "${quizId}") {
                id
                score
                totalQuestions
            }
        }
    `;

      await new Promise((resolve) => setTimeout(resolve, 500));
      const quizResultsResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: quizResultsQuery });

      expect(quizResultsResponse.body.data.getQuizResultByQuizId).toBeDefined();
      expect(quizResultsResponse.body.data.getQuizResultByQuizId.score).toBe(0);
      expect(
        quizResultsResponse.body.data.getQuizResultByQuizId.totalQuestions,
      ).toBe(2);
      expect(quizResultsResponse.body.errors).toBeUndefined();
    });
  });

  describe('Quiz Retrieval', () => {
    it('should retrieve a quiz by ID', async () => {
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      const quiz = await dbHelper.createTestQuiz(material.id, testUser.user.id);

      const getQuizQuery = `
        query GetQuizById {
            getQuizById(id: "${quiz.id}") {
                id
                type
                content
            }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizQuery });

      expect(response.body.data.getQuizById).toBeDefined();
      expect(response.body.data.getQuizById.id).toBe(quiz.id);
      expect(response.body.errors).toBeUndefined();
    });
    it('should retrieve quiz partial to continue quiz', async () => {
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      const quiz = await dbHelper.createTestQuiz(material.id, testUser.user.id);

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

      const getQuizQuery = `
        query GetQuizById {
          getQuizById(id: "${quiz.id}") {
              id
              partialData {
                  currentQuestionIndex
              }
          }
      }`;

      await request(app.getHttpServer())
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

      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizQuery });
      expect(response.body.data.getQuizById).toBeDefined();
      expect(
        response.body.data.getQuizById.partialData.currentQuestionIndex,
      ).toBe(1);
      expect(response.body.errors).toBeUndefined();
    });
    it('should not retrieve a quiz for a non-existent quiz', async () => {
      const getQuizQuery = `
        query GetQuizById {
          getQuizById(id: "non-existent-quiz-id") {
              id
              type
              content
          }
      }`;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizQuery });

      expect(response.body.data.getQuizById).toBeNull();
      expect(response.body.errors).toBeDefined();
    });
    it('should not retrieve a quiz without authentication', async () => {
      const getQuizQuery = `
        query GetQuizById {
          getQuizById(id: "non-existent-quiz-id") {
              id
              type
              content
          }
      }`;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: getQuizQuery });

      expect(response.body.data.getQuizById).toBeNull();
      expect(response.body.errors).toBeDefined();
    });
    it('should not retrieve a quiz for a quiz that does not belong to the user', async () => {
      const otherUser = await createUserAndLogin(app);
      const material = await dbHelper.createTestMaterial(otherUser.user.id);
      const quiz = await dbHelper.createTestQuiz(
        material.id,
        otherUser.user.id,
      );

      const getQuizQuery = `
        query GetQuizById {
          getQuizById(id: "${quiz.id}") {
              id
              type
              content
          }
      }`;
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizQuery });
      expect(response.body.data.getQuizById).toBeNull();
      expect(response.body.errors).toBeDefined();
    });
    it('should hide correct answers when retrieving active quiz', async () => {
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      const quiz = await dbHelper.createTestQuiz(material.id, testUser.user.id);

      const getQuizQuery = `
        query GetQuizById {
          getQuizById(id: "${quiz.id}") {
              id
              type
              content
          }
      }`;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizQuery });

      expect(response.body.data.getQuizById).toBeDefined();
      expect(response.body.data.getQuizById.content).toBeDefined();
      expect(
        response.body.data.getQuizById.content[0].correctAnswer,
      ).toBeUndefined();
    });
    it('should show correct answers and explanations after completion', async () => {
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      const quiz = await dbHelper.createTestQuiz(material.id, testUser.user.id);

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

      await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: submitQuizMutation,
          variables: {
            quizId: quiz.id,
            currentQuestionIndex: 2,
            questionsAndAnswers: questionsAndAnswers,
          },
        });
      const getQuizResultQuery = `
        query GetQuizResultByQuizId {
          getQuizResultByQuizId(id: "${quiz.id}") {
              id
              completedAt
              answers {
                  question
                  answer
                  isCorrect
              }
          }
      }
      `;

      await new Promise((resolve) => setTimeout(resolve, 500));
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizResultQuery });
      expect(response.body.data.getQuizResultByQuizId).toBeDefined();
      expect(response.body.data.getQuizResultByQuizId.answers).toBeDefined();
      expect(
        response.body.data.getQuizResultByQuizId.answers[0].isCorrect,
      ).toBeDefined();
    });
  });

  describe('Quiz Deletion', () => {
    it('should delete a quiz', async () => {
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      await dbHelper.createTestQuiz(material.id, testUser.user.id);

      const deleteQuizMutation = `
        mutation DeleteQuiz {
          deleteQuiz(id: "${material.id}")
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: deleteQuizMutation,
        });

      console.log(response.body);

      expect(response.body.data.deleteQuiz).toBe(true);
    });
    it('should not delete a quiz for a non-existent quiz', async () => {
      const deleteQuizMutation = `
        mutation DeleteQuiz {
          deleteQuiz(id: "non-existent-quiz-id")
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: deleteQuizMutation,
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.data).toBeNull();
    });
    it('should not delete a quiz without authentication', async () => {
      const deleteQuizMutation = `
        mutation DeleteQuiz {
          deleteQuiz(id: "non-existent-quiz-id")
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: deleteQuizMutation,
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.data).toBeNull();
    });
    it('should not delete a quiz for a quiz that does not belong to the user', async () => {
      const otherUser = await createUserAndLogin(app);
      const material = await dbHelper.createTestMaterial(otherUser.user.id);
      const quiz = await dbHelper.createTestQuiz(
        material.id,
        otherUser.user.id,
      );
      const deleteQuizMutation = `
        mutation DeleteQuiz {
          deleteQuiz(id: "${quiz.id}")
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: deleteQuizMutation,
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.data).toBeNull();
    });
    it('should cascade delete quiz results when deleting quiz', async () => {
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      const quiz = await dbHelper.createTestQuiz(material.id, testUser.user.id);
      const answers = [
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
      const quizResult = await dbHelper.createTestQuizResult(
        quiz.id,
        testUser.user.id,
        material.id,
        JSON.stringify(answers),
      );

      const deleteQuizMutation = `
          mutation DeleteQuiz {
            deleteQuiz(id: "${material.id}")
          }
        `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: deleteQuizMutation,
        });

      expect(response.body.data.deleteQuiz).toBe(true);

      const getQuizResultQuery = `
        query GetQuizResultById {
          getQuizResultById(id: ${quizResult.id}) {
              id
          }
      }
      `;

      const quizResultResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizResultQuery });

      expect(quizResultResponse.body.data).toBeUndefined();
      expect(quizResultResponse.body.errors).toBeDefined();
    });
  });

  describe('Quiz Progress', () => {
    it('should retrieve quiz progress', async () => {
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      const quiz = await dbHelper.createTestQuiz(material.id, testUser.user.id);
      await dbHelper.createTestQuizPartial(quiz.id, testUser.user.id);

      const getQuizWithPartialData = `
        query GetQuizById {
            getQuizById(id: "${quiz.id}") {
                id
                partialData {
                    currentQuestionIndex
                    questionsAndAnswers {
                        question
                        answer
                        isCorrect
                    }
                }
            }
        }      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizWithPartialData });

      console.log(response.body);

      expect(response.body.data.getQuizById).toBeDefined();
      expect(response.body.data.getQuizById.partialData).toBeDefined();
      expect(
        response.body.data.getQuizById.partialData.currentQuestionIndex,
      ).toBeDefined();
      expect(response.body.errors).toBeUndefined();
    });
    it('should not retrieve quiz progress for a non-existent quiz', async () => {
      const getQuizWithPartialData = `
        query GetQuizById {
            getQuizById(id: "non-existent-quiz-id") {
                id
                partialData {
                    currentQuestionIndex
                    questionsAndAnswers {
                        question
                        answer
                        isCorrect
                    }
                }
            }
        }      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizWithPartialData });

      expect(response.body.data.getQuizById).toBeNull();
      expect(response.body.errors).toBeDefined();
    });
    it('should not retrieve quiz progress without authentication', async () => {
      const getQuizWithPartialData = `
        query GetQuizById {
            getQuizById(id: "non-existent-quiz-id") {
                id
                partialData {
                    currentQuestionIndex
                    questionsAndAnswers {
                        question
                        answer
                        isCorrect
                    }
                }
            }
        }      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: getQuizWithPartialData });

      expect(response.body.data.getQuizById).toBeNull();
      expect(response.body.errors).toBeDefined();
    });
    it('should not retrieve quiz progress for a quiz that does not belong to the user', async () => {
      const otherUser = await createUserAndLogin(app);
      const material = await dbHelper.createTestMaterial(otherUser.user.id);
      const quiz = await dbHelper.createTestQuiz(
        material.id,
        otherUser.user.id,
      );

      const getQuizWithPartialData = `
          query GetQuizById {
              getQuizById(id: "${quiz.id}") {
                  id
                  partialData {
                      currentQuestionIndex
                      questionsAndAnswers {
                          question
                          answer
                          isCorrect
                      }
                  }
              }
          }      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizWithPartialData });

      expect(response.body.data.getQuizById).toBeNull();
      expect(response.body.errors).toBeDefined();
    });
    it('should clear progress after quiz completion', async () => {
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      const quiz = await dbHelper.createTestQuiz(material.id, testUser.user.id);

      const questionsAndAnswers = [
        {
          question: 1,
          answer: 'Wykazanie umiejętności zdobytych podczas studiów',
        },
      ];

      const fullQuizQAA = [
        ...questionsAndAnswers,
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

      const getQuizQuery = `
        query GetQuizById {
          getQuizById(id: "${quiz.id}") {
              id
              partialData {
                  currentQuestionIndex
              }
          }
      }`;

      await request(app.getHttpServer())
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

      await new Promise((resolve) => setTimeout(resolve, 500));

      const firstResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizQuery });
      expect(firstResponse.body.data.getQuizById).toBeDefined();
      expect(
        firstResponse.body.data.getQuizById.partialData.currentQuestionIndex,
      ).toBe(1);
      expect(firstResponse.body.errors).toBeUndefined();

      await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: submitQuizMutation,
          variables: {
            quizId: quiz.id,
            currentQuestionIndex: 2,
            questionsAndAnswers: fullQuizQAA,
          },
        });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const secondResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ query: getQuizQuery });

      expect(secondResponse.body.data.getQuizById).toBeDefined();
      expect(secondResponse.body.data.getQuizById.partialData).toBeNull();
    });
  });

  afterAll(async () => {
    await dbHelper.cleanupTestDatabase();
    await app.close();
  });
});
