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
  createMockQuiz,
  createMockQuizPartialInput,
  createMockQuizWithoutCorrectAnswers,
  createMockUser,
} from '../../test/helpers/test-data.helper';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { parsePublicPdfFromS3 } from '../helpers/parse-pdf';

jest.mock('../helpers/parse-pdf', () => ({
  parsePublicPdfFromS3: jest.fn(),
}));

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

  describe('createQuiz', () => {
    it('should create a quiz for a material', async () => {
      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      mockBillingService.useTokens.mockResolvedValue(true);

      (parsePublicPdfFromS3 as jest.Mock).mockResolvedValue(
        'Parsed PDF content',
      );

      mockOpenAiService.generateQuiz.mockResolvedValue(mockAIOutput.content);

      mockDrizzle.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      await service.createQuiz(mockMaterial.id, 'user-1');

      expect(mockDrizzle.insert).toHaveBeenCalledWith(expect.any(Object));
      expect(mockDrizzle.insert().values).toHaveBeenCalledWith({
        materialId: mockMaterial.id,
        type: 'quiz',
        content: mockAIOutput.content,
        createdAt: expect.any(Date),
      });
    });

    it('should throw UnauthorizedException if user does not have rights for material', async () => {
      const mockMaterial = createMockMaterial();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        service.createQuiz(mockMaterial.id, 'user-2'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockDrizzle.insert).not.toHaveBeenCalled();
    });

    it('should throw an error if quiz already exists for the material', async () => {
      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockAIOutput]),
      });

      await expect(
        service.createQuiz(mockMaterial.id, 'user-1'),
      ).rejects.toThrow(Error);
      expect(mockDrizzle.insert).not.toHaveBeenCalled();
    });

    it('should throw an error if user does not have enough tokens', async () => {
      const mockMaterial = createMockMaterial();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      mockBillingService.useTokens.mockResolvedValue(false);

      await expect(
        service.createQuiz(mockMaterial.id, 'user-1'),
      ).rejects.toThrow(Error);
      expect(mockDrizzle.insert).not.toHaveBeenCalled();
    });
    it('should handle PDF parsing errors gracefully', async () => {
      const mockMaterial = createMockMaterial();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      (parsePublicPdfFromS3 as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createQuiz(mockMaterial.id, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
    it('should handle AI service errors gracefully', async () => {
      const mockMaterial = createMockMaterial();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      (parsePublicPdfFromS3 as jest.Mock).mockResolvedValue(
        'Parsed PDF content',
      );

      mockOpenAiService.generateQuiz.mockRejectedValue(
        new Error('Failed to generate quiz'),
      );

      await expect(
        service.createQuiz(mockMaterial.id, 'user-1'),
      ).rejects.toThrow(Error);
    });
    it('should deduct 2 tokens from the user', async () => {
      const mockMaterial = createMockMaterial();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      (parsePublicPdfFromS3 as jest.Mock).mockResolvedValue(
        'Parsed PDF content',
      );

      mockOpenAiService.generateQuiz.mockResolvedValue(
        createMockAIOutput().content,
      );

      mockBillingService.useTokens.mockResolvedValue(true);

      await service.createQuiz(mockMaterial.id, 'user-1');

      expect(mockBillingService.useTokens).toHaveBeenCalledWith('user-1', 2);
    });
  });
  describe('getQuizById', () => {
    it('should return a quiz by ID while user owns it', async () => {
      const mockAIOutput = createMockQuiz();
      const mockMaterial = createMockMaterial();
      const mockQuizResponse = createMockQuizWithoutCorrectAnswers();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([
          {
            materials: mockMaterial,
            ai_outputs: { ...mockAIOutput, material: mockMaterial },
          },
        ]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      const result = await service.getQuizById(mockAIOutput.id, 'user-1');

      expect(result).toEqual({ ...mockQuizResponse, material: mockMaterial });
    });
    it('should throw NotFoundException if quiz does not exist', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      await expect(
        service.getQuizById('non-existing-id', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
    it('should throw UnauthorizedException if user does not own the quiz', async () => {
      const mockAIOutput = createMockQuiz();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]), // No results when user-2 tries to access
        innerJoin: jest.fn().mockReturnThis(),
      });

      await expect(
        service.getQuizById(mockAIOutput.id, 'user-2'),
      ).rejects.toThrow(NotFoundException);
    });
    it('should retrieve redis cached quiz if available', async () => {
      const mockAIOutput = createMockQuiz();
      const mockMaterial = createMockMaterial();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([
          {
            materials: mockMaterial,
            ai_outputs: { ...mockAIOutput, material: mockMaterial },
          },
        ]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      mockRedisService.get.mockResolvedValue(JSON.stringify(mockAIOutput));

      await service.getQuizById(mockAIOutput.id, mockMaterial.userId);

      expect(mockRedisService.get).toHaveBeenCalledWith(
        `quizSession:${mockMaterial.userId}:${mockAIOutput.id}`,
      );
    });
    it('should retrieve quiz from database if not in cache', async () => {
      const mockAIOutput = createMockQuiz();
      const mockMaterial = createMockMaterial();
      const mockQuizResponse = createMockQuizWithoutCorrectAnswers();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([
          {
            materials: mockMaterial,
            ai_outputs: mockAIOutput,
          },
        ]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getQuizById(
        mockAIOutput.id,
        mockMaterial.userId,
      );

      expect(result).toEqual({ ...mockQuizResponse, material: mockMaterial });
    });
    it('should return clear quiz if not found partial', async () => {
      const mockAIOutput = createMockQuiz();
      const mockMaterial = createMockMaterial();
      const mockQuizResponse = createMockQuizWithoutCorrectAnswers();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([
          {
            materials: mockMaterial,
            ai_outputs: mockAIOutput,
          },
        ]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      const result = await service.getQuizById(
        mockAIOutput.id,
        mockMaterial.userId,
      );

      expect(result).toEqual({ ...mockQuizResponse, material: mockMaterial });
    });
  });
  describe('savePartialToDb', () => {
    it('should save quiz partial to database', async () => {
      const mockQuizPartial = createMockQuizPartialInput();
      const mockQuiz = createMockQuiz();
      const mockUser = createMockUser();
      const mockMaterial = createMockMaterial();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockQuiz]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      mockDrizzle.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.savePartialToDB(
        mockUser.id,
        mockQuiz.id,
        mockQuizPartial,
      );

      expect(result).toBeNull();

      expect(mockDrizzle.insert).toHaveBeenCalledWith(expect.any(Object));
      expect(mockDrizzle.insert().values).toHaveBeenCalledWith({
        userId: mockUser.id,
        quizId: mockQuiz.id,
        currentQuestionIndex: mockQuizPartial.currentQuestionIndex,
        answers: expect.any(Array),
        lastUpdated: expect.any(Date),
      });
    });

    it('should return quiz result ID when quiz is completed', async () => {
      const mockQuiz = createMockQuiz();
      const mockUser = createMockUser();
      const mockMaterial = createMockMaterial();

      const completeQuizPartial = {
        currentQuestionIndex: mockQuiz.content.length,
        questionsAndAnswers: mockQuiz.content.map((_, index) => ({
          question: index + 1,
          answer: 'Test answer',
        })),
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockQuiz]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      mockDrizzle.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'quiz-result-1' }]),
        }),
      });

      const result = await service.savePartialToDB(
        mockUser.id,
        mockQuiz.id,
        completeQuizPartial,
      );

      expect(result).toBe('quiz-result-1');
    });
    it('should correctly count score', async () => {
      const mockQuiz = createMockQuiz();
      const mockUser = createMockUser();
      const mockMaterial = createMockMaterial();

      const completeQuizPartial = {
        currentQuestionIndex: mockQuiz.content.length,
        questionsAndAnswers: mockQuiz.content.map((_, index) => ({
          question: index + 1,
          answer: index % 2 === 0 ? 'Correct answer' : 'Wrong answer',
        })),
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockQuiz]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      mockDrizzle.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'quiz-result-1' }]),
        }),
      });

      const result = await service.savePartialToDB(
        mockUser.id,
        mockQuiz.id,
        completeQuizPartial,
      );

      expect(result).toBe('quiz-result-1');
    });
    it('should throw error if user does not have rights for material', async () => {
      const mockQuiz = createMockQuiz();
      const mockUser = createMockUser();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        service.savePartialToDB(mockUser.id, mockQuiz.id, {
          currentQuestionIndex: 1,
          questionsAndAnswers: [],
        }),
      ).rejects.toThrow(NotFoundException);
    });
    it('should delete partial and redis cache if quiz is completed', async () => {
      const mockQuiz = createMockQuiz();
      const mockUser = createMockUser();
      const mockMaterial = createMockMaterial();

      const completeQuizPartial = {
        currentQuestionIndex: mockQuiz.content.length,
        questionsAndAnswers: mockQuiz.content.map((_, index) => ({
          question: index + 1,
          answer: 'Test answer',
        })),
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockQuiz]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      mockDrizzle.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'quiz-result-1' }]),
        }),
      });

      await service.savePartialToDB(
        mockUser.id,
        mockQuiz.id,
        completeQuizPartial,
      );

      expect(mockDrizzle.delete).toHaveBeenCalledWith(expect.any(Object));
      expect(mockRedisService.delete).toHaveBeenCalledWith(
        `quizSession:${mockUser.id}:${mockQuiz.id}`,
      );
    });
  });
  describe('getQuizzesByMaterial', () => {
    it('should return quiz with statistics for a material', async () => {
      const mockMaterial = createMockMaterial();
      const mockQuiz = createMockQuiz();
      const mockUser = createMockUser();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([mockQuiz]),
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

      const result = await service.getQuizesByMaterial(
        mockMaterial.id,
        mockUser.id,
      );

      expect(result).toEqual({
        ...mockQuiz,
        material: mockMaterial,
        averageScore: 0,
        totalAttempts: 0,
        averagePercentage: 0,
        bestScore: 0,
        latestResult: null,
      });
    });

    it('should throw error if user does not have access to material', async () => {
      const mockMaterial = createMockMaterial();
      const mockUser = createMockUser();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        service.getQuizesByMaterial(mockMaterial.id, mockUser.id),
      ).rejects.toThrow('Material not found or access denied');
    });

    it('should return null if no quiz exists for material', async () => {
      const mockMaterial = createMockMaterial();
      const mockUser = createMockUser();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([]),
      });

      const result = await service.getQuizesByMaterial(
        mockMaterial.id,
        mockUser.id,
      );

      expect(result).toBeNull();
    });
  });
});
