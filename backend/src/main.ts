import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { setupBullBoard } from 'src/utils/setupBullBoard';
import { getQueueToken } from '@nestjs/bullmq';
import { json, raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  app.use('/billing/webhook', raw({ type: 'application/json' }));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.use(cookieParser());
  app.useLogger(app.get(Logger));
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  const quizProgressQueue = app.get(getQueueToken('quizProgress'));
  const { serverAdapter } = setupBullBoard([quizProgressQueue]);

  app.use('/admin/queues', serverAdapter.getRouter());

  await app.listen(process.env.PORT ?? 3001);

  console.log(
    `🚀 Server running on: http://localhost:${process.env.PORT ?? 3001}`,
  );
  console.log(
    `📊 Bull Dashboard available at: http://localhost:${process.env.PORT ?? 3001}/admin/queues`,
  );
}
bootstrap();
