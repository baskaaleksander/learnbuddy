import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { createUserAndLogin } from '../test/helpers/auth.helper';
import * as cookieParser from 'cookie-parser';
import { DatabaseHelper } from './helpers/database.helper';
describe('Materials (e2e)', () => {
  let app: INestApplication;
  let dbHelper: DatabaseHelper;
  let testUser: any;

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
  });

  describe('Material Upload & Processing', () => {
    it('should upload and process a PDF material', async () => {
      const uploadResponse = await request(app.getHttpServer())
        .post('/upload')
        .set('Cookie', testUser.fullCookie)
        .attach('file', 'test/fixtures/sample.pdf')
        .expect(201);
      const materialId = uploadResponse.body.materialId;
      expect(materialId).toBeDefined();
      const mutationCreateMaterial = `
          mutation CreateMaterial {
              createMaterial(input: { title: "Test Material", id: "${materialId}", description: "A test material for E2E testing" }) {
              id
              title
              description
              }
          }
          `;
      const mutationGetMaterial = `
          query GetMaterialById {
              getMaterialById(id: "${materialId}") {
                  title
                  status
                  }
              }
          `;
      await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `jwt=${testUser.token}`)
        .send({
          query: mutationCreateMaterial,
        })
        .expect(200);
      const material = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutationGetMaterial,
        })
        .set('Cookie', `jwt=${testUser.token}`)
        .expect(200);
      expect(material.body.data.getMaterialById.status).toBe('PROCESSED');
      expect(material.body.data.getMaterialById.title).toBe('Test Material');
    });
    it('should reject invalid file types', async () => {
      await request(app.getHttpServer())
        .post('/upload')
        .set('Cookie', `jwt=${testUser.token}`)
        .attach('file', Buffer.from('fake content'), 'test.txt')
        .expect(400);
    });
  });

  describe('Material CRUD Operations', () => {
    it('should get paginated user materials', async () => {
      await createTestMaterial(testUser.user.id);

      const materialsQuery = `
            query GetUserMaterials {
                getUserMaterials(page: 1, pageSize: 10, sortBy: "createdAt-desc", status: "all") {
                    data {
                        id
                        title
                        status
                        description
                        createdAt
                    }
					totalItems
					totalPages
					currentPage
					pageSize
					hasNextPage
					hasPreviousPage
					}
                }
        `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `jwt=${testUser.token}`)
        .send({
          query: materialsQuery,
        })
        .expect(200);
      expect(response.body.data.getUserMaterials).toHaveProperty('data');
      expect(response.body.data.getUserMaterials).toHaveProperty('totalItems');
      expect(response.body.data.getUserMaterials).toHaveProperty(
        'currentPage',
        1,
      );
    });
    it('should update material details', async () => {
      const material = await createTestMaterial(testUser.user.id);
      const updateMaterialMutation = `
        mutation UpdateMaterial {
            updateMaterial(input: { title: "Updated Title", description: "Updated Description", id: "${material.id}" })
        }
        `;
      const getMaterialQuery = `
        query GetMaterialById {
        getMaterialById(id: "${material.id}") {
            title
            description
        }
    }`;

      const updateResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `jwt=${testUser.token}`)
        .send({
          query: updateMaterialMutation,
        })
        .expect(200);

      const materialAfterUpdate = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `jwt=${testUser.token}`)
        .send({
          query: getMaterialQuery,
        })
        .expect(200);
      expect(materialAfterUpdate.body.data.getMaterialById.title).toBe(
        'Updated Title',
      );
      expect(materialAfterUpdate.body.data.getMaterialById.description).toBe(
        'Updated Description',
      );
      expect(updateResponse.body.data.updateMaterial).toBe(true);
    });
    it('should delete material and cascade related data', async () => {
      const material = await createTestMaterial(testUser.user.id);
      const deleteMaterialMutation = `
        mutation DeleteMaterial {
            deleteMaterial(id: "${material.id}")
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `jwt=${testUser.token}`)
        .send({
          query: deleteMaterialMutation,
        })
        .expect(200);

      expect(response.body.data.deleteMaterial).toBe(true);

      const getMaterialQuery = `
        query GetMaterialById {
            getMaterialById(id: "${material.id}") {
                id
            }
        }
        `;

      const getMaterialResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `jwt=${testUser.token}`)
        .send({
          query: getMaterialQuery,
        });
      expect(getMaterialResponse.body.data.getMaterialById).toBeNull();
    });
  });

  describe('Authorization & Security', () => {
    it('should prevent access to other users materials', async () => {
      const otherUser = await createUserAndLogin(app);

      const material = await createTestMaterial(otherUser.user.id);

      const getMaterialQuery = `
        query GetMaterialById {
            getMaterialById(id: "${material.id}") {
                id
            }
        }
        `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `jwt=${testUser.token}`)
        .send({
          query: getMaterialQuery,
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe(
        'You do not have permission to access this material',
      );
    });

    it('should require authentication for all material endpoints', async () => {
      const getUserMaterialsQuery = `
        query GetUserMaterials {
            getUserMaterials(page: 1, pageSize: 10, sortBy: "createdAt-desc", status: "all") {
                data {
                    id
                    title
                    status
                    description
                    createdAt
                }
                totalItems
                totalPages
                currentPage
                pageSize
                hasNextPage
                hasPreviousPage
            }
        }
        `;
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getUserMaterialsQuery,
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('No token found');
    });
  });

  describe('Material Processing Edge Cases', () => {
    it.todo('should handle concurrent uploads from same user');
    it.todo('should respect file size limits');
    it.todo('should handle network timeouts during upload');
    it.todo('should clean up failed uploads properly');
    it.todo('should handle AI service rate limits');
    it.todo('should process different file formats (PDF, DOCX, TXT)');
  });

  describe('Token Usage & Billing Integration', () => {
    it.todo('should deduct tokens after successful processing');
    it.todo('should not charge tokens for failed processing');
    it.todo('should block processing when user has no tokens');
    it.todo('should handle premium vs free tier differences');
  });

  afterAll(async () => {
    await dbHelper.cleanupTestDatabase();
    await app.close();
  });
});
