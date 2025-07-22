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
  createMockQuizWithoutCorrectAnswers,
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
    it('should return redis cached quiz if available', async () => {
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
});
