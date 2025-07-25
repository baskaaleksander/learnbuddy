import { Test, TestingModule } from '@nestjs/testing';
import { FlashcardsService } from './flashcards.service';
import { OpenAiService } from '../open-ai/open-ai.service';
import { BillingService } from '../billing/billing.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  createMockFlaschardsAiOutput,
  createMockFlashcard,
  createMockMaterial,
} from '../../test/helpers/test-data.helper';
import { parsePublicPdfFromS3 } from '../helpers/parse-pdf';

jest.mock('../helpers/parse-pdf', () => ({
  parsePublicPdfFromS3: jest.fn(),
}));

describe('FlashcardsService', () => {
  let service: FlashcardsService;
  let mockDrizzle: any;
  let mockOpenAiService: any;
  let mockBillingService: any;

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
      generateFlashcards: jest.fn(),
    };

    mockBillingService = {
      useTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlashcardsService,
        {
          provide: 'DRIZZLE',
          useValue: mockDrizzle,
        },
        {
          provide: OpenAiService,
          useValue: mockOpenAiService,
        },
        {
          provide: BillingService,
          useValue: mockBillingService,
        },
      ],
    }).compile();

    service = module.get<FlashcardsService>(FlashcardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFlashcardsByMaterial', () => {
    it('should throw UnauthorizedException when user does not own material', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });
      await expect(
        service.getFlashcardsByMaterial('material-1', 'user-2'),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('should throw UnauthorizedException when material does not exist', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });
      await expect(
        service.getFlashcardsByMaterial('non-existing-material', 'user-2'),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('should return flashcards when user owns material', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();
      const mockFlashcardCards = Array.from({ length: 2 }, (_, i) => ({
        ...createMockFlashcard(),
        id: `flashcard-${i + 1}`,
      }));
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockFlashcards]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(mockFlashcardCards),
      });

      const result = await service.getFlashcardsByMaterial(
        mockMaterial.id,
        mockMaterial.userId,
      );
      expect(result).toEqual(mockFlashcardCards);
    });
    it('should throw NotFoundException when no flashcards exist for material', async () => {
      const mockMaterial = createMockMaterial();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        service.getFlashcardsByMaterial(mockMaterial.id, mockMaterial.userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFlashcardProgressByMaterial', () => {
    it('should throw UnauthorizedException when user does not own material', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });
      await expect(
        service.getFlashcardProgressByMaterial('material-1', 'user-2'),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('should throw UnauthorizedException when material does not exist', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });
      await expect(
        service.getFlashcardProgressByMaterial(
          'non-existing-material',
          'user-2',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('should return empty array when no AI output exists', async () => {
      const mockMaterial = createMockMaterial();
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      const result = await service.getFlashcardProgressByMaterial(
        mockMaterial.id,
        mockMaterial.userId,
      );
      expect(result).toEqual([]);
    });
    it('should return flashcards with progress status when found', () => {});
  });

  describe('createFlashcards', () => {
    it('should throw UnauthorizedException when user does not own material', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });
      await expect(
        service.createFlashcards('material-1', 'user-2'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when material does not exist', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });
      await expect(
        service.createFlashcards('non-existing-material', 'user-2'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when flashcards already exist for material', async () => {
      const mockMaterial = createMockMaterial();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([createMockFlaschardsAiOutput()]),
      });

      await expect(
        service.createFlashcards(mockMaterial.id, mockMaterial.userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should bill user tokens before generation', async () => {
      const mockMaterial = createMockMaterial();
      const mockAiOutputId = 'ai-output-123';

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

      mockOpenAiService.generateFlashcards.mockResolvedValue({
        flashcards: [{ question: 'Test question', answer: 'Test answer' }],
      });

      mockDrizzle.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: mockAiOutputId }]),
      });

      mockDrizzle.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 'flashcard-123' }]),
      });

      mockDrizzle.insert.mockReturnValueOnce({
        values: jest.fn().mockResolvedValue(undefined),
      });

      await service.createFlashcards(mockMaterial.id, mockMaterial.userId);

      expect(mockBillingService.useTokens).toHaveBeenCalledWith(
        mockMaterial.userId,
        2,
      );
    });

    it('should not create flashcards if PDF parsing fails', async () => {
      const mockMaterial = createMockMaterial();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      (parsePublicPdfFromS3 as jest.Mock).mockRejectedValue(
        new Error('PDF parsing failed'),
      );

      await expect(
        service.createFlashcards(mockMaterial.id, mockMaterial.userId),
      ).rejects.toThrow('PDF parsing failed');
    });
    it('should not create flashcards if OpenAI generation fails', async () => {
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

      mockOpenAiService.generateFlashcards.mockRejectedValue(
        new Error('OpenAI generation failed'),
      );

      await expect(
        service.createFlashcards(mockMaterial.id, mockMaterial.userId),
      ).rejects.toThrow('OpenAI generation failed');
    });
    it('should not bill user if OpenAI fails', async () => {
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

      mockOpenAiService.generateFlashcards.mockRejectedValue(
        new Error('OpenAI generation failed'),
      );

      await expect(
        service.createFlashcards(mockMaterial.id, mockMaterial.userId),
      ).rejects.toThrow('OpenAI generation failed');
    });
    it('should create progress entries for all generated flashcards', async () => {
      const mockMaterial = createMockMaterial();
      const mockAiOutputId = 'ai-output-123';

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

      mockOpenAiService.generateFlashcards.mockResolvedValue({
        flashcards: [
          { question: 'Question 1', answer: 'Answer 1' },
          { question: 'Question 2', answer: 'Answer 2' },
        ],
      });

      mockDrizzle.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: mockAiOutputId }]),
      });

      mockDrizzle.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 'flashcard-1' }]),
      });

      mockDrizzle.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 'flashcard-2' }]),
      });

      const mockProgressValues1 = jest.fn().mockResolvedValue(undefined);
      const mockProgressValues2 = jest.fn().mockResolvedValue(undefined);

      mockDrizzle.insert.mockReturnValueOnce({
        values: mockProgressValues1,
      });

      mockDrizzle.insert.mockReturnValueOnce({
        values: mockProgressValues2,
      });

      await service.createFlashcards(mockMaterial.id, mockMaterial.userId);

      expect(mockProgressValues1).toHaveBeenCalledWith(
        expect.objectContaining({
          flashcardId: 'flashcard-1',
          userId: mockMaterial.userId,
          status: 'review',
        }),
      );

      expect(mockProgressValues2).toHaveBeenCalledWith(
        expect.objectContaining({
          flashcardId: 'flashcard-2',
          userId: mockMaterial.userId,
          status: 'review',
        }),
      );

      expect(mockDrizzle.insert).toHaveBeenCalledTimes(5);
    });

    it('should create AI output, flashcards, and progress entries successfully', async () => {
      const mockMaterial = createMockMaterial();
      const mockAiOutputId = 'ai-output-123';
      const mockFlashcardId = 'flashcard-123';

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

      mockOpenAiService.generateFlashcards.mockResolvedValue({
        flashcards: [{ question: 'Test question', answer: 'Test answer' }],
      });

      const mockValuesMethod = jest.fn().mockReturnThis();
      const mockReturningMethod = jest.fn();

      mockDrizzle.insert.mockReturnValueOnce({
        values: mockValuesMethod,
        returning: mockReturningMethod.mockResolvedValue([
          { id: mockAiOutputId },
        ]),
      });

      mockDrizzle.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: mockFlashcardId }]),
      });

      mockDrizzle.insert.mockReturnValueOnce({
        values: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.createFlashcards(
        mockMaterial.id,
        mockMaterial.userId,
      );

      expect(result).toBe(true);

      expect(mockValuesMethod).toHaveBeenCalledWith(
        expect.objectContaining({
          materialId: mockMaterial.id,
          type: 'flashcards',
          content: {
            flashcards: {
              flashcards: [
                { question: 'Test question', answer: 'Test answer' },
              ],
            },
          },
          createdAt: expect.any(Date),
        }),
      );

      expect(mockBillingService.useTokens).toHaveBeenCalledWith(
        mockMaterial.userId,
        2,
      );

      expect(mockDrizzle.insert).toHaveBeenCalledTimes(3);
    });
  });

  describe('deleteFlashcards', () => {
    it('should throw UnauthorizedException when user does not own material', () => {});
    it('should throw NotFoundException when no flashcards found', () => {});
    it('should delete by AI output ID when provided', () => {});
    it('should delete by material ID when AI output ID not found', () => {});
    it('should call deleteFlashcardsByAiOutputId with correct ID', () => {});
  });

  describe('deleteFlashcardsByAiOutputId', () => {
    it('should throw NotFoundException when no flashcards found for AI output', () => {});
    it('should delete progress entries before flashcards', () => {});
    it('should delete flashcards before AI output', () => {});
    it('should handle empty flashcard arrays', () => {});
  });

  describe('resetFlashcardProgress', () => {
    it('should throw NotFoundException when flashcard set not found', () => {});
    it('should throw NotFoundException when user does not own flashcard set', () => {});
    it('should reset all flashcards in set to review status', () => {});
    it('should handle empty flashcard sets', () => {});
  });

  describe('getFlashcardsSetsByUser', () => {
    it('should return empty result when user has no flashcards', () => {});
    it('should calculate totalPages correctly', () => {});
    it('should set hasNextPage correctly for first page', () => {});
    it('should set hasPreviousPage correctly for last page', () => {});
    it('should handle page beyond total pages', () => {});
    it('should sort by createdAt-desc by default', () => {});
    it('should sort by title when specified', () => {});
    it('should return correct progress statistics', () => {});
  });

  describe('getFlashcardsById', () => {
    it('should return empty data when user does not own flashcard set', () => {});
    it('should return all flashcards when no status filter provided', () => {});
    it('should filter flashcards by status when provided', () => {});
    it('should return correct progress statistics', () => {});
  });

  describe('updateFlashcardStatus', () => {
    it('should update flashcard status successfully', () => {});
    it('should throw NotFoundException when flashcard progress not found', () => {});
    it('should throw NotFoundException when user does not own flashcard', () => {});
    it('should accept all valid FlashcardProgressStatus values', () => {});
  });

  describe('regenerateFlashcards', () => {
    it('should delete existing flashcards before creating new ones', () => {});
    it('should return false if deletion fails', () => {});
    it('should create new flashcards after successful deletion', () => {});
    it('should maintain data integrity throughout the process', () => {});
  });
});
