import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { DatabaseHelper } from './helpers/database.helper';

describe('Auth (e2e)', () => {
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
  describe('User Registration', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `testuser${Date.now()}@example.com`,
          password: 'password',
          firstName: 'Test',
        })
        .expect(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).toHaveProperty('accessToken');
    });
    it('should not allow duplicate user registration', async () => {
      const email = `duplicateuser${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'password',
          firstName: 'Test',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'password',
          firstName: 'Test',
        })
        .expect(409);
    });

    it('should not register a user with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password',
          firstName: 'Test',
        })
        .expect(400);
    });

    it('should not register a user with missing fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `testuser${Date.now()}@example.com`,
          password: 'password',
        })
        .expect(400);
    });
  });

  describe('User Login', () => {
    it('should log in a registered user', async () => {
      const email = `loginuser${Date.now()}@example.com`;
      await request(app.getHttpServer()).post('/auth/register').send({
        email,
        password: 'password',
        firstName: 'Test',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: 'password',
        })
        .expect(200);

      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should not log in with incorrect password', async () => {
      const email = `wrongloginuser${Date.now()}@example.com`;
      await request(app.getHttpServer()).post('/auth/register').send({
        email,
        password: 'password',
        firstName: 'Test',
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: 'wrongpassword',
        })
        .expect(409);
    });

    it('should not log in with unregistered email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `unregistered${Date.now()}@example.com`,
          password: 'password',
        })
        .expect(409);
    });
  });

  afterAll(async () => {
    await dbHelper.cleanupTestDatabase();
    await app.close();
  });
});
