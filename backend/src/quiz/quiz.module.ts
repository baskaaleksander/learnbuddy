import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizResolver } from './quiz.resolver';
import { OpenAiModule } from 'src/open-ai/open-ai.module';

@Module({
  providers: [QuizService, QuizResolver],
  imports: [OpenAiModule]
})
export class QuizModule {}
