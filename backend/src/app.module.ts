import { Module } from '@nestjs/common';
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
import GraphQLJSON from 'graphql-type-json';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      context: (({ req, res }) => ({ req, res })),
      driver: ApolloDriver,
      resolvers: { JSON: GraphQLJSON },
      autoSchemaFile: true,
      debug: true,
      playground: true,
    }),
    DrizzleModule, AuthModule, UploadModule, EmailModule, MaterialsModule, UserModule, OpenAiModule, QuizModule, SummaryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
