import { Processor, WorkerHost } from '@nestjs/bullmq';
import { QuizService } from './quiz.service';
import { Job } from 'bullmq';

interface QuizProgressJobData {
  userId: string;
  quizId: string;
}

@Processor('quizProgress')
export class QuizProcessor extends WorkerHost {
  constructor(private readonly quizService: QuizService) {
    super();
  }

  async process(job: Job<QuizProgressJobData>): Promise<void> {
    const { userId, quizId } = job.data;

    await this.quizService.savePartialToDB(userId, quizId);
  }
}
