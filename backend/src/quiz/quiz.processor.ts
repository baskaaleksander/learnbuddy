import { Processor, WorkerHost } from '@nestjs/bullmq';
import { QuizService } from './quiz.service';
import { Job } from 'bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { QuizPartialInput } from './dtos/quiz-partial.input';

interface QuizProgressJobData {
  userId: string;
  quizId: string;
  quizPartialData: QuizPartialInput;
}

@Processor('quizProgress')
@Injectable()
export class QuizProcessor extends WorkerHost implements OnModuleInit {
  constructor(
    private readonly quizService: QuizService,
    private readonly logger: Logger,
  ) {
    super();
  }

  async process(job: Job<QuizProgressJobData>): Promise<void> {
    const { userId, quizId, quizPartialData } = job.data;

    await this.quizService.savePartialToDB(userId, quizId, quizPartialData);
  }

  onModuleInit() {
    this.worker.on('completed', (job) => {
      this.logger.log(
        job.name,
        `Completed(${job.id}): ${JSON.stringify(job.data)}`,
      );
    });

    this.worker.on('active', (job) => {
      this.logger.log(
        job.name,
        `Active (${job.id}): ${JSON.stringify(job.data)}`,
      );
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        job?.name,
        `Failed(${job?.id}): ${JSON.stringify(job?.data)} - Error: ${err.message}`,
      );
    });
  }
}
