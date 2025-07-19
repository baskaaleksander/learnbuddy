import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizResolver } from './quiz.resolver';
import { OpenAiModule } from 'src/open-ai/open-ai.module';
import { QueueModule } from '../queue/queue.module';
import { BullModule } from '@nestjs/bullmq';
import { QuizProcessor } from './quiz.processor';
import { RedisService } from '../redis/redis.service';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  providers: [QuizService, QuizResolver, QuizProcessor, RedisService],
  imports: [
    OpenAiModule,
    QueueModule,
    BullModule.registerQueue({
      name: 'quizProgress',
    }),
    BillingModule,
  ],
})
export class QuizModule {}
