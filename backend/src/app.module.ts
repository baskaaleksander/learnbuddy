import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './database/drizzle.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './upload/upload.module';
import { EmailModule } from './email/email.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MaterialsModule } from './materials/materials.module';
import { UserModule } from './user/user.module';
import { OpenAiModule } from './open-ai/open-ai.module';
import { QuizModule } from './quiz/quiz.module';
import { SummaryModule } from './summary/summary.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import GraphQLJSON from 'graphql-type-json';
import * as depthLimit from 'graphql-depth-limit';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { LoggerModule } from 'nestjs-pino';
import { BillingModule } from './billing/billing.module';
import { ExportModule } from './export/export.module';
import { StatsModule } from './stats/stats.module';
import { ScheduledTaskModule } from './scheduled-task/scheduled-task.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      context: ({ req, res }) => ({ req, res }),
      driver: ApolloDriver,
      resolvers: { JSON: GraphQLJSON },
      autoSchemaFile: true,
      debug: true,
      playground: true,
      validationRules: [depthLimit(5)],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
        customSuccessMessage: (req, res) =>
          `${req.method} ${req.url} ${res.statusCode}`,
      },
    }),
    DrizzleModule,
    AuthModule,
    UploadModule,
    EmailModule,
    MaterialsModule,
    UserModule,
    OpenAiModule,
    QuizModule,
    SummaryModule,
    FlashcardsModule,
    RedisModule,
    QueueModule,
    BillingModule,
    ExportModule,
    StatsModule,
    ScheduledTaskModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor() {}

  configure(consumer: MiddlewareConsumer) {}
}
