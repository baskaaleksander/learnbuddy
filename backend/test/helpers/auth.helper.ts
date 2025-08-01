import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export async function createUserAndLogin(app: INestApplication) {
  const randomEmail = `testuser${Date.now()}@example.com`;
  const registerResponse = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email: randomEmail,
      password: 'password',
      firstName: 'Test',
    });

  let token;
  if (registerResponse.headers['set-cookie']) {
    const cookies = registerResponse.headers['set-cookie'];

    for (const cookie of cookies) {
      if (cookie.startsWith('jwt=')) {
        token = cookie.split(';')[0];
        break;
      }
    }
  }

  return {
    user: registerResponse.body,
    token: token.replace('jwt=', ''),
    fullCookie: token,
  };
}
