import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from './quiz.service';
import { OpenAiService } from '../open-ai/open-ai.service';
import { RedisService } from '../redis/redis.service';
import { BillingService } from '../billing/billing.service';
import { Logger } from 'nestjs-pino';
import { getQueueToken } from '@nestjs/bullmq';
import {
  createMockAIOutput,
  createMockMaterial,
} from '../../test/helpers/test-data.helper';

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

  describe('getQuizesByMaterial', () => {
    it('should return quiz with statistics when material and quiz exist', async () => {
      const materialId = 'material-1';
      const userId = 'user-1';
      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();
      const mockAverageScore = {
        averageScore: '7.5',
        totalAttempts: 3,
        bestScore: 9,
        totalQuestions: 10,
      };
      const mockLatestResult = {
        score: 8,
        completedAt: new Date(),
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockAIOutput]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnValue([mockAverageScore]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockLatestResult]),
      });

      const result = await service.getQuizesByMaterial(materialId, userId);

      expect(result).toEqual({
        id: mockAIOutput.id,
        materialId: mockAIOutput.materialId,
        type: mockAIOutput.type,
        content: mockAIOutput.content,
        createdAt: mockAIOutput.createdAt,
        errorMessage: mockAIOutput.errorMessage,
        averageScore: 7.5,
        totalAttempts: 3,
        averagePercentage: 75.0,
        bestScore: 9,
        latestResult: {
          score: 8,
          completedAt: mockLatestResult.completedAt,
        },
        material: {
          id: mockMaterial.id,
          userId: mockMaterial.userId,
          title: mockMaterial.title,
          description: mockMaterial.description,
          status: mockMaterial.status,
          content: mockMaterial.content,
          createdAt: mockMaterial.createdAt,
        },
      });
    });

    it('should throw error when material not found or access denied', async () => {
      const materialId = 'material-1';
      const userId = 'user-1';

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        service.getQuizesByMaterial(materialId, userId),
      ).rejects.toThrow('Material not found or access denied');
    });

    it('should return null when no quiz exists for material', async () => {
      const materialId = 'material-1';
      const userId = 'user-1';
      const mockMaterial = createMockMaterial();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([]),
      });

      const result = await service.getQuizesByMaterial(materialId, userId);

      expect(result).toBeNull();
    });

    it('should return quiz with default statistics when no quiz results exist', async () => {
      const materialId = 'material-1';
      const userId = 'user-1';
      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockAIOutput]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnValue([]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([]),
      });

      const result = await service.getQuizesByMaterial(materialId, userId);

      expect(result).toEqual({
        id: mockAIOutput.id,
        materialId: mockAIOutput.materialId,
        type: mockAIOutput.type,
        content: mockAIOutput.content,
        createdAt: mockAIOutput.createdAt,
        errorMessage: mockAIOutput.errorMessage,
        averageScore: 0,
        totalAttempts: 0,
        averagePercentage: 0,
        bestScore: 0,
        latestResult: null,
        material: {
          id: mockMaterial.id,
          userId: mockMaterial.userId,
          title: mockMaterial.title,
          description: mockMaterial.description,
          status: mockMaterial.status,
          content: mockMaterial.content,
          createdAt: mockMaterial.createdAt,
        },
      });
    });

    it('should handle quiz with statistics but no latest result', async () => {
      const materialId = 'material-1';
      const userId = 'user-1';
      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();
      const mockAverageScore = {
        averageScore: '6.0',
        totalAttempts: 2,
        bestScore: 7,
        totalQuestions: 10,
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockAIOutput]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnValue([mockAverageScore]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([]),
      });

      const result = await service.getQuizesByMaterial(materialId, userId);

      expect(result).toEqual({
        id: mockAIOutput.id,
        materialId: mockAIOutput.materialId,
        type: mockAIOutput.type,
        content: mockAIOutput.content,
        createdAt: mockAIOutput.createdAt,
        errorMessage: mockAIOutput.errorMessage,
        averageScore: 6.0,
        totalAttempts: 2,
        averagePercentage: 60.0,
        bestScore: 7,
        latestResult: null,
        material: {
          id: mockMaterial.id,
          userId: mockMaterial.userId,
          title: mockMaterial.title,
          content: mockMaterial.content,
          createdAt: mockMaterial.createdAt,
          description: mockMaterial.description,
          status: mockMaterial.status,
        },
      });
    });
  });

  describe('getQuizInfoById', () => {
    it('should return quiz info with statistics when quiz exists', async () => {
      const quizId = 'quiz-1';
      const userId = 'user-1';
      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();
      const mockQuizJoined = {
        ai_outputs: mockAIOutput,
        materials: mockMaterial,
      };
      const mockAverageScore = {
        averageScore: '8.5',
        totalAttempts: 4,
        bestScore: 10,
        totalQuestions: 10,
      };
      const mockLatestResult = {
        score: 9,
        completedAt: new Date(),
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockQuizJoined]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnValue([mockAverageScore]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockLatestResult]),
      });

      const result = await service.getQuizInfoById(quizId, userId);

      expect(result).toEqual({
        id: mockAIOutput.id,
        materialId: mockAIOutput.materialId,
        type: mockAIOutput.type,
        content: mockAIOutput.content,
        createdAt: mockAIOutput.createdAt,
        errorMessage: mockAIOutput.errorMessage,
        averageScore: 8.5,
        totalAttempts: 4,
        averagePercentage: 85.0,
        bestScore: 10,
        latestResult: {
          score: 9,
          completedAt: mockLatestResult.completedAt,
        },
        material: {
          id: mockMaterial.id,
          userId: mockMaterial.userId,
          title: mockMaterial.title,
          description: mockMaterial.description,
          status: mockMaterial.status,
          content: mockMaterial.content,
          createdAt: mockMaterial.createdAt,
        },
      });
    });

    it('should return null when quiz not found', async () => {
      const quizId = 'non-existent-quiz';
      const userId = 'user-1';

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([]),
      });

      const result = await service.getQuizInfoById(quizId, userId);

      expect(result).toBeNull();
    });

    it('should return null when quiz exists but user has no access', async () => {
      const quizId = 'quiz-1';
      const userId = 'unauthorized-user';

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([]),
      });

      const result = await service.getQuizInfoById(quizId, userId);

      expect(result).toBeNull();
    });

    it('should return quiz info with default statistics when no quiz results exist', async () => {
      const quizId = 'quiz-1';
      const userId = 'user-1';
      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();
      const mockQuizJoined = {
        ai_outputs: mockAIOutput,
        materials: mockMaterial,
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockQuizJoined]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnValue([]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([]),
      });

      const result = await service.getQuizInfoById(quizId, userId);

      expect(result).toEqual({
        id: mockAIOutput.id,
        materialId: mockAIOutput.materialId,
        type: mockAIOutput.type,
        content: mockAIOutput.content,
        createdAt: mockAIOutput.createdAt,
        errorMessage: mockAIOutput.errorMessage,
        averageScore: 0,
        totalAttempts: 0,
        averagePercentage: 0,
        bestScore: 0,
        latestResult: null,
        material: {
          id: mockMaterial.id,
          userId: mockMaterial.userId,
          title: mockMaterial.title,
          description: mockMaterial.description,
          status: mockMaterial.status,
          content: mockMaterial.content,
          createdAt: mockMaterial.createdAt,
        },
      });
    });

    it('should handle quiz with statistics but no latest result', async () => {
      const quizId = 'quiz-1';
      const userId = 'user-1';
      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();
      const mockQuizJoined = {
        ai_outputs: mockAIOutput,
        materials: mockMaterial,
      };
      const mockAverageScore = {
        averageScore: '7.2',
        totalAttempts: 5,
        bestScore: 8,
        totalQuestions: 10,
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockQuizJoined]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnValue([mockAverageScore]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([]),
      });

      const result = await service.getQuizInfoById(quizId, userId);

      expect(result).toEqual({
        id: mockAIOutput.id,
        materialId: mockAIOutput.materialId,
        type: mockAIOutput.type,
        content: mockAIOutput.content,
        createdAt: mockAIOutput.createdAt,
        errorMessage: mockAIOutput.errorMessage,
        averageScore: 7.2,
        totalAttempts: 5,
        averagePercentage: 72.0,
        bestScore: 8,
        latestResult: null,
        material: {
          id: mockMaterial.id,
          userId: mockMaterial.userId,
          title: mockMaterial.title,
          description: mockMaterial.description,
          status: mockMaterial.status,
          content: mockMaterial.content,
          createdAt: mockMaterial.createdAt,
        },
      });
    });

    it('should handle quiz with latest result but no average score statistics', async () => {
      const quizId = 'quiz-1';
      const userId = 'user-1';
      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();
      const mockQuizJoined = {
        ai_outputs: mockAIOutput,
        materials: mockMaterial,
      };
      const mockLatestResult = {
        score: 6,
        completedAt: new Date(),
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockQuizJoined]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnValue([]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockLatestResult]),
      });

      const result = await service.getQuizInfoById(quizId, userId);

      expect(result).toEqual({
        id: mockAIOutput.id,
        materialId: mockAIOutput.materialId,
        type: mockAIOutput.type,
        content: mockAIOutput.content,
        createdAt: mockAIOutput.createdAt,
        errorMessage: mockAIOutput.errorMessage,
        averageScore: 0,
        totalAttempts: 0,
        averagePercentage: 0,
        bestScore: 0,
        latestResult: {
          score: 6,
          completedAt: mockLatestResult.completedAt,
        },
        material: {
          id: mockMaterial.id,
          userId: mockMaterial.userId,
          title: mockMaterial.title,
          description: mockMaterial.description,
          status: mockMaterial.status,
          content: mockMaterial.content,
          createdAt: mockMaterial.createdAt,
        },
      });
    });

    it('should correctly calculate average percentage from average score and total questions', async () => {
      const quizId = 'quiz-1';
      const userId = 'user-1';
      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();
      const mockQuizJoined = {
        ai_outputs: mockAIOutput,
        materials: mockMaterial,
      };
      const mockAverageScore = {
        averageScore: '3.75',
        totalAttempts: 2,
        bestScore: 4,
        totalQuestions: 5,
      };
      const mockLatestResult = {
        score: 4,
        completedAt: new Date(),
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockQuizJoined]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnValue([mockAverageScore]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockLatestResult]),
      });

      const result = await service.getQuizInfoById(quizId, userId);

      if (!result) {
        throw new Error('Quiz not found');
      }

      expect(result.averageScore).toBe(3.75);
      expect(result.averagePercentage).toBe(75.0);
      expect(result.totalAttempts).toBe(2);
      expect(result.bestScore).toBe(4);
    });

    it('should verify correct database queries are executed', async () => {
      const quizId = 'quiz-1';
      const userId = 'user-1';
      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();
      const mockQuizJoined = {
        ai_outputs: mockAIOutput,
        materials: mockMaterial,
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockQuizJoined]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnValue([]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([]),
      });

      await service.getQuizInfoById(quizId, userId);

      expect(mockDrizzle.select).toHaveBeenCalledTimes(3);
    });
  });

  describe('getQuizesByUser', () => {
    it('should return paginated quizzes with statistics for user', async () => {
      const userId = 'user-1';
      const page = 1;
      const pageSize = 10;
      const sortBy = 'createdAt-desc';

      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();
      const mockQuizJoined = {
        ai_outputs: mockAIOutput,
        materials: mockMaterial,
      };
      const mockAverageScore = {
        averageScore: '8.0',
        totalAttempts: 3,
        bestScore: 9,
        totalQuestions: 10,
      };
      const mockLatestResult = {
        score: 8,
        completedAt: new Date(),
      };

      // Mock total count query
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 1 }]),
      });

      // Mock main quizzes query
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue([mockQuizJoined]),
      });

      // Mock average score query
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnValue([mockAverageScore]),
      });

      // Mock latest result query
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockLatestResult]),
      });

      const result = await service.getQuizesByUser(
        userId,
        page,
        pageSize,
        sortBy,
      );

      expect(result).toEqual({
        data: [
          {
            id: mockAIOutput.id,
            materialId: mockAIOutput.materialId,
            type: mockAIOutput.type,
            content: mockAIOutput.content,
            createdAt: mockAIOutput.createdAt,
            errorMessage: mockAIOutput.errorMessage,
            averageScore: 8.0,
            totalAttempts: 3,
            averagePercentage: 80.0,
            bestScore: 9,
            latestResult: {
              score: 8,
              completedAt: mockLatestResult.completedAt,
            },
            material: {
              id: mockMaterial.id,
              userId: mockMaterial.userId,
              title: mockMaterial.title,
              description: mockMaterial.description,
              status: mockMaterial.status,
              content: mockMaterial.content,
              createdAt: mockMaterial.createdAt,
            },
          },
        ],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should return empty result when user has no quizzes', async () => {
      const userId = 'user-with-no-quizzes';

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 0 }]),
      });

      const result = await service.getQuizesByUser(userId);

      expect(result).toEqual({
        data: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should handle pagination correctly with multiple pages', async () => {
      const userId = 'user-1';
      const page = 2;
      const pageSize = 5;
      const totalItems = 12;

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: totalItems }]),
      });

      const mockQuizJoined = {
        ai_outputs: createMockAIOutput(),
        materials: createMockMaterial(),
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue([mockQuizJoined]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnValue([]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([]),
      });

      const result = await service.getQuizesByUser(userId, page, pageSize);

      expect(result.totalItems).toBe(12);
      expect(result.totalPages).toBe(3); // Math.ceil(12/5)
      expect(result.currentPage).toBe(2);
      expect(result.pageSize).toBe(5);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should handle different sorting options correctly', async () => {
      const userId = 'user-1';
      const sortBy = 'title-desc';

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 1 }]),
      });

      const mockQuizJoined = {
        ai_outputs: createMockAIOutput(),
        materials: createMockMaterial(),
      };

      const mockOrderBy = jest.fn().mockReturnThis();
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: mockOrderBy,
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue([mockQuizJoined]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnValue([]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([]),
      });

      await service.getQuizesByUser(userId, 1, 10, sortBy);

      expect(mockOrderBy).toHaveBeenCalled();
    });

    it('should handle quizzes with no statistics gracefully', async () => {
      const userId = 'user-1';

      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();
      const mockQuizJoined = {
        ai_outputs: mockAIOutput,
        materials: mockMaterial,
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 1 }]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue([mockQuizJoined]),
      });

      // No average score data
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnValue([]),
      });

      // No latest result data
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([]),
      });

      const result = await service.getQuizesByUser(userId);

      expect(result.data[0]).toEqual({
        id: mockAIOutput.id,
        materialId: mockAIOutput.materialId,
        type: mockAIOutput.type,
        content: mockAIOutput.content,
        createdAt: mockAIOutput.createdAt,
        errorMessage: mockAIOutput.errorMessage,
        averageScore: 0,
        totalAttempts: 0,
        averagePercentage: 0,
        bestScore: 0,
        latestResult: null,
        material: {
          id: mockMaterial.id,
          userId: mockMaterial.userId,
          title: mockMaterial.title,
          description: mockMaterial.description,
          status: mockMaterial.status,
          content: mockMaterial.content,
          createdAt: mockMaterial.createdAt,
        },
      });
    });

    it('should use default parameters when not provided', async () => {
      const userId = 'user-1';

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 0 }]),
      });

      const result = await service.getQuizesByUser(userId);

      expect(result.currentPage).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should correctly calculate pagination metadata', async () => {
      const userId = 'user-1';
      const page = 1;
      const pageSize = 10;
      const totalItems = 25;

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: totalItems }]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue([]),
      });

      const result = await service.getQuizesByUser(userId, page, pageSize);

      expect(result.totalItems).toBe(25);
      expect(result.totalPages).toBe(3); // Math.ceil(25/10)
      expect(result.currentPage).toBe(1);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should verify correct number of database queries are executed', async () => {
      const userId = 'user-1';

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 1 }]),
      });

      const mockQuizJoined = {
        ai_outputs: createMockAIOutput(),
        materials: createMockMaterial(),
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue([mockQuizJoined]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnValue([]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([]),
      });

      await service.getQuizesByUser(userId);

      // Should be called: 1 (count) + 1 (main query) + 2 (stats per quiz) = 4 times
      expect(mockDrizzle.select).toHaveBeenCalledTimes(4);
    });
  });
});
