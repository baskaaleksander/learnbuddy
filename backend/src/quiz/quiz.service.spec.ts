import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from './quiz.service';
import { OpenAiService } from 'src/open-ai/open-ai.service';
import { RedisService } from '../redis/redis.service';
import { BillingService } from 'src/billing/billing.service';
import { Logger } from 'nestjs-pino';
import { getQueueToken } from '@nestjs/bullmq';

describe('QuizService', () => {
  let service: QuizService;
  let mockDrizzle: any;
  let mockOpenAiService: any;
  let mockRedisService: any;
  let mockBillingService: any;
  let mockLogger: any;
  let mockQuizProgressQueue: any;

  beforeEach(async () => {
    mockDrizzle = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };

    mockOpenAiService = {
      generateQuiz: jest.fn(),
    };

    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    mockBillingService = {
      useTokens: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    mockQuizProgressQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: 'DRIZZLE',
          useValue: mockDrizzle,
        },
        {
          provide: OpenAiService,
          useValue: mockOpenAiService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: BillingService,
          useValue: mockBillingService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: getQueueToken('quizProgress'),
          useValue: mockQuizProgressQueue,
        },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
