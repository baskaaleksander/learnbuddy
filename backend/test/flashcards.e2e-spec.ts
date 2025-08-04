import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { DatabaseHelper } from './helpers/database.helper';
import { createUserAndLogin } from './helpers/auth.helper';

describe('Flashcards (e2e)', () => {
  let app: INestApplication;
  let dbHelper: DatabaseHelper;

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
  });
  afterAll(async () => {
    await dbHelper.cleanupTestDatabase();
    await app.close();
  });
  describe('Complete Flashcard Workflow (e2e)', () => {
    it('should complete full flashcard learning journey: create → study → track progress', async () => {
      const testUser = await createUserAndLogin(app);
      // 1. User uploads and processes a material
      const material = await dbHelper.createTestMaterial(testUser.user.id);

      // 2. Generate flashcards from processed material
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: `
            mutation CreateFlashcard {
              createFlashcard(materialId: "${material.id}")
            }
          `,
        })
        .expect(200);

      expect(createResponse.body.data.createFlashcard).toBe(true);

      // 3. Retrieve generated flashcards
      const flashcardsResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: `
            query GetFlashcardsByMaterial {
              getFlashcardsByMaterial(materialId: "${material.id}") {
                id
                question
                answer
              }
            }
          `,
        })
        .expect(200);

      const flashcards = flashcardsResponse.body.data.getFlashcardsByMaterial;
      expect(flashcards.length).toBeGreaterThan(0);

      // 4. Study flashcards - mark some as known, some for review
      await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: `
            mutation UpdateFlashcardProgress {
              updateFlashcardProgress(id: "${flashcards[0].id}", status: "known")
            }
          `,
        })
        .expect(200);

      // 5. Check progress statistics
      const statsResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: `
            query GetFlashcardsSetsByUser {
              getFlashcardsSetsByUser(page: 1, pageSize: 10) {
                data {
                  total
                  known
                  review
                }
              }
            }
          `,
        })
        .expect(200);

      const stats = statsResponse.body.data.getFlashcardsSetsByUser.data[0];
      expect(stats.known).toBe(1);
      expect(stats.review).toBeGreaterThan(0);
    });
  });

  describe('Flashcard Generation (e2e)', () => {
    it('should generate flashcards from PDF content using AI', async () => {
      const testUser = await createUserAndLogin(app);
      const material = await dbHelper.createTestMaterial(testUser.user.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: `
                mutation CreateFlashcard {
                createFlashcard(materialId: "${material.id}")
                }
            `,
        })
        .expect(200);

      expect(response.body.data.createFlashcard).toBe(true);

      const getFlashcardsByMaterialQuery = `
        query GetFlashcardsByMaterial {
            getFlashcardsByMaterial(materialId: "${material.id}") {
            id
            question
            answer
            }
        }
        `;

      const flashcardsResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: getFlashcardsByMaterialQuery,
        })
        .expect(200);

      const flashcards = flashcardsResponse.body.data.getFlashcardsByMaterial;

      expect(flashcards.length).toBeGreaterThan(0);
      expect(flashcards[0].question).toBeDefined();
      expect(flashcards[0].answer).toBeDefined();
    });
    it('should prevent duplicate flashcards from same material', async () => {
      const testUser = await createUserAndLogin(app);
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      await dbHelper.createTestFlashcards(material.id, testUser.user.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: `
                mutation CreateFlashcard {
                createFlashcard(materialId: "${material.id}")
                }
            `,
        })
        .expect(200);

      expect(response.body.errors[0].message).toBe(
        'Flashcards already generated for this material',
      );
    });
    it('should deduct user tokens for flashcard generation', async () => {
      const testUser = await createUserAndLogin(app);
      const initialUserData = await dbHelper.getUserData(testUser.user.id);
      const material = await dbHelper.createTestMaterial(testUser.user.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: `
                mutation CreateFlashcard {
                createFlashcard(materialId: "${material.id}")
                }
            `,
        })
        .expect(200);

      expect(response.body.data.createFlashcard).toBe(true);

      const updatedUserData = await dbHelper.getUserData(testUser.user.id);

      expect(updatedUserData.tokensUsed).toBe(initialUserData.tokensUsed + 2);
    });
  });

  describe('Flashcard Progress System (e2e)', () => {
    it('should track user progress on flashcards', async () => {
      const testUser = await createUserAndLogin(app);
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      await dbHelper.createTestFlashcards(material.id, testUser.user.id);

      const getFlashcardsByMaterialQuery = `
          query GetFlashcardsByMaterial {
              getFlashcardsByMaterial(materialId: "${material.id}") {
              id
              }
          }
          `;

      const getFlashcardsStatsQuery = `
        query GetFlashcardStatsByMaterial {
        getFlashcardStatsByMaterial(materialId: "${material.id}") {
            known
            review
        }
    }
    `;

      const initialFlashcardsStatsResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: getFlashcardsStatsQuery,
        });

      const initialFlashcardsStats =
        initialFlashcardsStatsResponse.body.data.getFlashcardStatsByMaterial;

      const flashcardsResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: getFlashcardsByMaterialQuery,
        })
        .expect(200);

      const flashcards = flashcardsResponse.body.data.getFlashcardsByMaterial;

      expect(flashcards.length).toBeGreaterThan(0);

      const flashcardId = flashcards[0].id;

      const updateProgressQuery = `
          mutation UpdateFlashcardProgress {
            updateFlashcardProgress(id: "${flashcardId}", status: "known")
          }
        `;

      const updateResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: updateProgressQuery,
        })
        .expect(200);

      expect(updateResponse.body.data.updateFlashcardProgress).toBe(true);

      const updatedFlashcardsStatsResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: getFlashcardsStatsQuery,
        })
        .expect(200);

      const updatedFlashcardsStats =
        updatedFlashcardsStatsResponse.body.data.getFlashcardStatsByMaterial;

      expect(updatedFlashcardsStats.known).toBe(
        initialFlashcardsStats.known + 1,
      );
      expect(updatedFlashcardsStats.review).toBe(
        initialFlashcardsStats.review - 1,
      );
    });
    it('should reset flashcards progress', async () => {
      const testUser = await createUserAndLogin(app);
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      const flashcardsId = await dbHelper.createTestFlashcards(
        material.id,
        testUser.user.id,
      );

      const getFlashcardsByMaterialQuery = `
            query GetFlashcardsByMaterial {
                getFlashcardsByMaterial(materialId: "${material.id}") {
                id
                }
            }
            `;

      const getFlashcardsStatsQuery = `
            query GetFlashcardStatsByMaterial {
            getFlashcardStatsByMaterial(materialId: "${material.id}") {
                known
                review
                }
            }
            `;

      const flashcardsResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: getFlashcardsByMaterialQuery,
        })
        .expect(200);

      const flashcards = flashcardsResponse.body.data.getFlashcardsByMaterial;

      expect(flashcards.length).toBeGreaterThan(0);

      const flashcardId = flashcards[0].id;

      const updateProgressQuery = `
            mutation UpdateFlashcardProgress {
                updateFlashcardProgress(id: "${flashcardId}", status: "known")
            }
            `;

      const resetProgressQuery = `
            mutation ResetFlashcardProgress {
                resetFlashcardProgress(id: "${flashcardsId}")
            }
            `;

      await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: updateProgressQuery,
        })
        .expect(200);

      const initialStatsResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: getFlashcardsStatsQuery,
        })
        .expect(200);

      const initialStats =
        initialStatsResponse.body.data.getFlashcardStatsByMaterial;

      expect(initialStats.known).toBe(1);
      expect(initialStats.review).toBe(flashcards.length - 1);

      const resetResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: resetProgressQuery,
        })
        .expect(200);

      expect(resetResponse.body.data.resetFlashcardProgress).toBe(true);

      const updatedStatsResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: getFlashcardsStatsQuery,
        })
        .expect(200);

      const updatedStats =
        updatedStatsResponse.body.data.getFlashcardStatsByMaterial;

      expect(updatedStats.known).toBe(0);
      expect(updatedStats.review).toBe(flashcards.length);
    });
  });

  describe('Flashcard Management (e2e)', () => {
    it('should regenerate flashcards for a material', async () => {
      const testUser = await createUserAndLogin(app);
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      await dbHelper.createTestFlashcards(material.id, testUser.user.id);

      const regenerateMutation = `
        mutation RegenerateFlashcards {
            regenerateFlashcards(materialId: "${material.id}")
        }
    `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: regenerateMutation,
        })
        .expect(200);

      expect(response.body.data.regenerateFlashcards).toBe(true);
    });
    it('should delete flashcards for a material and cascade progress', async () => {
      const testUser = await createUserAndLogin(app);
      const material = await dbHelper.createTestMaterial(testUser.user.id);
      const flashcardsId = await dbHelper.createTestFlashcards(
        material.id,
        testUser.user.id,
      );

      const deleteMutation = `
        mutation DeleteFlashcard {
          deleteFlashcard(id: "${flashcardsId}")
        }
      `;

      const getFlashcardsStatsQuery = `
        query GetFlashcardStatsByMaterial {
          getFlashcardStatsByMaterial(materialId: "${material.id}") {
            known
            review
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: deleteMutation,
        })
        .expect(200);

      expect(response.body.data.deleteFlashcard).toBe(true);

      const statsResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser.fullCookie)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          query: getFlashcardsStatsQuery,
        })
        .expect(200);

      expect(statsResponse.body.data.getFlashcardStatsByMaterial).toEqual({
        known: 0,
        review: 0,
      });
    });
  });

  describe('Flashcard Security (e2e)', () => {
    it('should prevent unauthorized access to flashcards', async () => {
      const testUser1 = await createUserAndLogin(app);
      const testUser2 = await createUserAndLogin(app);

      const material = await dbHelper.createTestMaterial(testUser1.user.id);
      await dbHelper.createTestFlashcards(material.id, testUser1.user.id);

      const getFlashcardsQuery = `
          query GetFlashcardsByMaterial {
            getFlashcardsByMaterial(materialId: "${material.id}") {
              id
              question
              answer
            }
          }
        `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', testUser2.fullCookie)
        .set('Authorization', `Bearer ${testUser2.accessToken}`)
        .send({
          query: getFlashcardsQuery,
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe(
        'Material not found or access denied',
      );
    });
    it('should require authorization for flashcard operations', async () => {
      const createFlashcardMutation = `
            mutation CreateFlashcard {
                createFlashcard(materialId: "nonexistent-material-id")
                }
        `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createFlashcardMutation,
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('No token found');
    });
  });
});
