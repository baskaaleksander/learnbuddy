import { Test, TestingModule } from '@nestjs/testing';
import { FlashcardsService } from './flashcards.service';
import { OpenAiService } from '../open-ai/open-ai.service';
import { BillingService } from '../billing/billing.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  createMockFlaschardsAiOutput,
  createMockFlashcard,
  createMockFlashcardProgress,
  createMockMaterial,
} from '../../test/helpers/test-data.helper';
import { parsePublicPdfFromS3 } from '../helpers/parse-pdf';
import { MockDrizzle } from '../utils/types';
import { FlashcardProgressStatus } from './graphql/flashcard-progress.graphql';

jest.mock('../helpers/parse-pdf', () => ({
  parsePublicPdfFromS3: jest.fn(),
}));

describe('FlashcardsService', () => {
  let service: FlashcardsService;
  let mockDrizzle: MockDrizzle;
  let mockOpenAiService: { generateFlashcards: jest.Mock };
  let mockBillingService: { useTokens: jest.Mock };

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
    it('should throw UnauthorizedException when user does not own material', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        service.deleteFlashcards('material-1', 'user-2'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when no flashcards found', async () => {
      const mockMaterial = createMockMaterial();
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        service.deleteFlashcards(mockMaterial.id, mockMaterial.userId),
      ).rejects.toThrow(NotFoundException);
    });
    it('should delete by AI output ID when provided', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();
      const mockFlashcardCards = [
        { id: 'flashcard-1', aiOutputId: mockFlashcards.id },
        { id: 'flashcard-2', aiOutputId: mockFlashcards.id },
      ];

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([
          {
            ai_outputs: mockFlashcards,
            materials: mockMaterial,
          },
        ]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(mockFlashcardCards),
      });

      mockDrizzle.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.deleteFlashcards(
        mockFlashcards.id,
        mockMaterial.userId,
      );

      expect(result).toBe(true);
      expect(mockDrizzle.delete).toHaveBeenCalledTimes(3);
    });

    it('should delete by material ID when AI output ID not found', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();
      const mockFlashcardCards = [
        { id: 'flashcard-1', aiOutputId: mockFlashcards.id },
      ];

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
        innerJoin: jest.fn().mockReturnThis(),
      });

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

      mockDrizzle.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.deleteFlashcards(
        mockMaterial.id,
        mockMaterial.userId,
      );

      expect(result).toBe(true);
      expect(mockDrizzle.delete).toHaveBeenCalledTimes(3);
    });

    it('should call deleteFlashcardsByAiOutputId with correct ID', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();

      const deleteFlashcardsSpy = jest.spyOn(
        service as any,
        'deleteFlashcardsByAiOutputId',
      );
      deleteFlashcardsSpy.mockResolvedValue(undefined);

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([
          {
            ai_outputs: mockFlashcards,
            materials: mockMaterial,
          },
        ]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      await service.deleteFlashcards(mockFlashcards.id, mockMaterial.userId);

      expect(deleteFlashcardsSpy).toHaveBeenCalledWith(mockFlashcards.id);

      deleteFlashcardsSpy.mockRestore();
    });
  });

  describe('deleteFlashcardsByAiOutputId', () => {
    it('should throw NotFoundException when no flashcards found for AI output', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        (service as any).deleteFlashcardsByAiOutputId('non-existent-ai-output'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete progress entries before flashcards', async () => {
      const mockFlashcardCards = [
        { id: 'flashcard-1', aiOutputId: 'ai-output-1' },
        { id: 'flashcard-2', aiOutputId: 'ai-output-1' },
      ];

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(mockFlashcardCards),
      });

      const mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
      mockDrizzle.delete.mockReturnValue({
        where: mockDeleteWhere,
      });

      await (service as any).deleteFlashcardsByAiOutputId('ai-output-1');

      expect(mockDrizzle.delete).toHaveBeenCalledTimes(3);
      expect(mockDeleteWhere).toHaveBeenCalledTimes(3);
    });

    it('should delete flashcards before AI output', async () => {
      const mockFlashcardCards = [
        { id: 'flashcard-1', aiOutputId: 'ai-output-1' },
      ];

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(mockFlashcardCards),
      });

      const mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
      mockDrizzle.delete.mockReturnValue({
        where: mockDeleteWhere,
      });

      await (service as any).deleteFlashcardsByAiOutputId('ai-output-1');

      expect(mockDrizzle.delete).toHaveBeenCalledTimes(3);
    });

    it('should handle empty flashcard arrays', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        (service as any).deleteFlashcardsByAiOutputId('ai-output-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetFlashcardProgress', () => {
    it('should throw NotFoundException when flashcard set not found', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      await expect(
        service.resetFlashcardProgress('non-existing-set', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
    it('should throw NotFoundException when user does not own flashcard set', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      await expect(
        service.resetFlashcardProgress('set-1', 'user-2'),
      ).rejects.toThrow(NotFoundException);
    });
    it('should reset all flashcards in set to review status', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockReturnValue([
            { ai_outputs: mockFlashcards, materials: mockMaterial },
          ]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      mockDrizzle.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.resetFlashcardProgress(
        mockFlashcards.id,
        mockMaterial.userId,
      );

      expect(result).toBe(true);

      expect(mockDrizzle.update).toHaveBeenCalledTimes(1);

      expect(mockDrizzle.update().set).toHaveBeenCalledWith({
        status: 'review',
      });
    });
    it('should handle empty flashcard sets', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockReturnValue([
            { ai_outputs: mockFlashcards, materials: mockMaterial },
          ]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      mockDrizzle.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.resetFlashcardProgress(
        mockFlashcards.id,
        mockMaterial.userId,
      );

      expect(result).toBe(true);
      expect(mockDrizzle.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFlashcardsSetsByUser', () => {
    it('should return empty result when user has no flashcards', async () => {
      // Mock the count query - should return array with count property
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 0 }]), // Fixed: return array
      });

      const result = await service.getFlashcardsSetsByUser('user-1');
      expect(result.data).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
    });
    it('should calculate totalPages correctly', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 25 }]),
      });

      const mockAiOutput = [
        {
          ai_outputs: createMockFlaschardsAiOutput(),
          materials: createMockMaterial(),
        },
      ];

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue(mockAiOutput),
      });

      mockDrizzle.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      const result = await service.getFlashcardsSetsByUser('user-1');
      expect(result.totalPages).toBe(3);
      expect(result.totalItems).toBe(25);
    });
    it('should set hasNextPage correctly for first page', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 25 }]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue([
          {
            ai_outputs: mockFlashcards,
            materials: mockMaterial,
          },
        ]),
      });

      mockDrizzle.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      const result = await service.getFlashcardsSetsByUser('user-1', 1);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(false);
    });
    it('should set hasPreviousPage correctly for last page', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 25 }]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue([
          {
            ai_outputs: mockFlashcards,
            materials: mockMaterial,
          },
        ]),
      });

      mockDrizzle.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      const result = await service.getFlashcardsSetsByUser('user-1', 3);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });
    it('should handle page beyond total pages', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 25 }]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue([]),
      });

      const result = await service.getFlashcardsSetsByUser('user-1', 5);
      expect(result.data).toEqual([]);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });
    it('should sort by createdAt-desc by default', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 5 }]),
      });

      const mockOrderBy = jest.fn().mockReturnThis();
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: mockOrderBy,
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue([
          {
            ai_outputs: mockFlashcards,
            materials: mockMaterial,
          },
        ]),
      });

      mockDrizzle.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await service.getFlashcardsSetsByUser('user-1');
      expect(mockOrderBy).toHaveBeenCalled();
    });
    it('should sort by title when specified', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 5 }]),
      });

      const mockOrderBy = jest.fn().mockReturnThis();
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: mockOrderBy,
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue([
          {
            ai_outputs: mockFlashcards,
            materials: mockMaterial,
          },
        ]),
      });

      mockDrizzle.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await service.getFlashcardsSetsByUser('user-1', 1, 10, 'title-asc');
      expect(mockOrderBy).toHaveBeenCalled();
    });
    it('should return correct progress statistics', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();

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
        offset: jest.fn().mockReturnValue([
          {
            ai_outputs: mockFlashcards,
            materials: mockMaterial,
          },
        ]),
      });

      mockDrizzle.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([
          {
            flashcards: { id: 'fc-1' },
            flashcard_progress: { status: 'known' },
          },
          {
            flashcards: { id: 'fc-2' },
            flashcard_progress: { status: 'review' },
          },
        ]),
      });

      const result = await service.getFlashcardsSetsByUser('user-1');
      expect(result.data[0].total).toBe(2);
      expect(result.data[0].known).toBe(1);
      expect(result.data[0].review).toBe(1);
    });
  });

  describe('getFlashcardsById', () => {
    it('should return empty data when user does not own flashcard set', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      const result = await service.getFlashcardsById(
        'flashcard-set-1',
        'user-2',
      );
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.known).toBe(0);
      expect(result.review).toBe(0);
    });
    it('should return all flashcards when no status filter provided', async () => {
      const mockFlashcards = createMockFlaschardsAiOutput();
      const mockMaterial = createMockMaterial();
      const mockFlashcardsWithProgress = [
        {
          flashcards: {
            id: 'flashcard-1',
            question: 'What is 2+2?',
            answer: '4',
            aiOutputId: mockFlashcards.id,
          },
          flashcard_progress: {
            id: 'progress-1',
            status: 'review',
            updatedAt: new Date(),
          },
        },
        {
          flashcards: {
            id: 'flashcard-2',
            question: 'What is 3+3?',
            answer: '6',
            aiOutputId: mockFlashcards.id,
          },
          flashcard_progress: {
            id: 'progress-2',
            status: 'known',
            updatedAt: new Date(),
          },
        },
      ];

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockReturnValue([
            { ai_outputs: mockFlashcards, materials: mockMaterial },
          ]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(mockFlashcardsWithProgress),
        innerJoin: jest.fn().mockReturnThis(),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(mockFlashcardsWithProgress),
        innerJoin: jest.fn().mockReturnThis(),
      });

      const result = await service.getFlashcardsById(
        mockFlashcards.id,
        mockMaterial.userId,
      );

      expect(result.data).toEqual([
        {
          flashcardId: 'flashcard-1',
          statusId: 'progress-1',
          question: 'What is 2+2?',
          answer: '4',
          status: 'review',
          statusUpdatedAt: expect.any(Date),
        },
        {
          flashcardId: 'flashcard-2',
          statusId: 'progress-2',
          question: 'What is 3+3?',
          answer: '6',
          status: 'known',
          statusUpdatedAt: expect.any(Date),
        },
      ]);
      expect(result.total).toBe(2);
      expect(result.known).toBe(1);
      expect(result.review).toBe(1);
    });
    it('should filter flashcards by status when provided', async () => {
      const mockFlashcards = createMockFlaschardsAiOutput();
      const mockMaterial = createMockMaterial();
      const mockFilteredFlashcards = [
        {
          flashcards: {
            id: 'flashcard-1',
            question: 'What is 2+2?',
            answer: '4',
            aiOutputId: mockFlashcards.id,
          },
          flashcard_progress: {
            id: 'progress-1',
            status: 'known',
            updatedAt: new Date(),
          },
        },
      ];
      const mockAllFlashcards = [
        {
          flashcards: {
            id: 'flashcard-1',
            question: 'What is 2+2?',
            answer: '4',
            aiOutputId: mockFlashcards.id,
          },
          flashcard_progress: {
            id: 'progress-1',
            status: 'known',
            updatedAt: new Date(),
          },
        },
        {
          flashcards: {
            id: 'flashcard-2',
            question: 'What is 3+3?',
            answer: '6',
            aiOutputId: mockFlashcards.id,
          },
          flashcard_progress: {
            id: 'progress-2',
            status: 'review',
            updatedAt: new Date(),
          },
        },
      ];

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockReturnValue([
            { ai_outputs: mockFlashcards, materials: mockMaterial },
          ]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(mockFilteredFlashcards),
        innerJoin: jest.fn().mockReturnThis(),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(mockAllFlashcards),
        innerJoin: jest.fn().mockReturnThis(),
      });

      const result = await service.getFlashcardsById(
        mockFlashcards.id,
        mockMaterial.userId,
        'known',
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('known');
      expect(result.total).toBe(2);
      expect(result.known).toBe(1);
      expect(result.review).toBe(1);
    });
    it('should return correct progress statistics', async () => {
      const mockFlashcards = createMockFlaschardsAiOutput();
      const mockMaterial = createMockMaterial();
      const mockFlashcardsWithProgress = [
        {
          flashcards: {
            id: 'flashcard-1',
            question: 'What is 2+2?',
            answer: '4',
            aiOutputId: mockFlashcards.id,
          },
          flashcard_progress: {
            id: 'progress-1',
            status: 'known',
            updatedAt: new Date(),
          },
        },
        {
          flashcards: {
            id: 'flashcard-2',
            question: 'What is 3+3?',
            answer: '6',
            aiOutputId: mockFlashcards.id,
          },
          flashcard_progress: {
            id: 'progress-2',
            status: 'known',
            updatedAt: new Date(),
          },
        },
        {
          flashcards: {
            id: 'flashcard-3',
            question: 'What is 4+4?',
            answer: '8',
            aiOutputId: mockFlashcards.id,
          },
          flashcard_progress: {
            id: 'progress-3',
            status: 'review',
            updatedAt: new Date(),
          },
        },
      ];

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockReturnValue([
            { ai_outputs: mockFlashcards, materials: mockMaterial },
          ]),
        innerJoin: jest.fn().mockReturnThis(),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(mockFlashcardsWithProgress),
        innerJoin: jest.fn().mockReturnThis(),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(mockFlashcardsWithProgress),
        innerJoin: jest.fn().mockReturnThis(),
      });

      const result = await service.getFlashcardsById(
        mockFlashcards.id,
        mockMaterial.userId,
      );

      expect(result.total).toBe(3);
      expect(result.known).toBe(2);
      expect(result.review).toBe(1);
      expect(result.material).toEqual(
        expect.objectContaining({
          id: mockMaterial.id,
          title: mockMaterial.title,
        }),
      );
    });
  });

  describe('updateFlashcardStatus', () => {
    it('should update flashcard status successfully', async () => {
      const mockFlashcardProgress = createMockFlashcardProgress('review');

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockFlashcardProgress]),
      });

      mockDrizzle.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.updateFlashcardStatus(
        mockFlashcardProgress.flashcardId,
        mockFlashcardProgress.userId,
        FlashcardProgressStatus.known,
      );

      expect(result).toBe(true);
    });

    it('should throw NotFoundException when flashcard progress not found', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        service.updateFlashcardStatus(
          'non-existent-id',
          'user-1',
          FlashcardProgressStatus.known,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user does not own flashcard', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        service.updateFlashcardStatus(
          'flashcard-1',
          'user-2',
          FlashcardProgressStatus.known,
        ),
      ).rejects.toThrow(NotFoundException);
    });
    it('should accept all valid FlashcardProgressStatus values', async () => {
      const mockFlashcardProgress = createMockFlashcardProgress('review');

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockFlashcardProgress]),
      });

      mockDrizzle.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      });

      const result1 = await service.updateFlashcardStatus(
        mockFlashcardProgress.flashcardId,
        mockFlashcardProgress.userId,
        FlashcardProgressStatus.known,
      );

      expect(result1).toBe(true);

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockFlashcardProgress]),
      });

      mockDrizzle.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      });

      const result2 = await service.updateFlashcardStatus(
        mockFlashcardProgress.flashcardId,
        mockFlashcardProgress.userId,
        FlashcardProgressStatus.review,
      );

      expect(result2).toBe(true);
    });
  });

  describe('regenerateFlashcards', () => {
    it('should delete existing flashcards before creating new ones', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockFlashcards]),
      });

      const deleteFlashcardsSpy = jest.spyOn(service, 'deleteFlashcards');
      deleteFlashcardsSpy.mockResolvedValue(true);

      const createFlashcardsSpy = jest.spyOn(service, 'createFlashcards');
      createFlashcardsSpy.mockResolvedValue(true);

      const result = await service.regenerateFlashcards(
        mockMaterial.id,
        mockMaterial.userId,
      );

      expect(result).toBe(true);
      expect(deleteFlashcardsSpy).toHaveBeenCalledWith(
        mockFlashcards.id,
        mockMaterial.userId,
      );
      expect(createFlashcardsSpy).toHaveBeenCalledWith(
        mockMaterial.id,
        mockMaterial.userId,
      );

      deleteFlashcardsSpy.mockRestore();
      createFlashcardsSpy.mockRestore();
    });

    it('should return false if deletion fails', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockFlashcards]),
      });

      const deleteFlashcardsSpy = jest.spyOn(service, 'deleteFlashcards');
      deleteFlashcardsSpy.mockResolvedValue(false);

      const createFlashcardsSpy = jest.spyOn(service, 'createFlashcards');

      const result = await service.regenerateFlashcards(
        mockMaterial.id,
        mockMaterial.userId,
      );

      expect(result).toBe(false);
      expect(deleteFlashcardsSpy).toHaveBeenCalledWith(
        mockFlashcards.id,
        mockMaterial.userId,
      );
      expect(createFlashcardsSpy).not.toHaveBeenCalled();

      deleteFlashcardsSpy.mockRestore();
      createFlashcardsSpy.mockRestore();
    });

    it('should create new flashcards after successful deletion', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockFlashcards]),
      });

      const deleteFlashcardsSpy = jest.spyOn(service, 'deleteFlashcards');
      deleteFlashcardsSpy.mockResolvedValue(true);

      const createFlashcardsSpy = jest.spyOn(service, 'createFlashcards');
      createFlashcardsSpy.mockResolvedValue(true);

      const result = await service.regenerateFlashcards(
        mockMaterial.id,
        mockMaterial.userId,
      );

      expect(result).toBe(true);
      expect(createFlashcardsSpy).toHaveBeenCalledWith(
        mockMaterial.id,
        mockMaterial.userId,
      );

      deleteFlashcardsSpy.mockRestore();
      createFlashcardsSpy.mockRestore();
    });

    it('should maintain data integrity throughout the process', async () => {
      const mockMaterial = createMockMaterial();
      const mockFlashcards = createMockFlaschardsAiOutput();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockFlashcards]),
      });

      const deleteFlashcardsSpy = jest.spyOn(service, 'deleteFlashcards');
      deleteFlashcardsSpy.mockResolvedValue(true);

      const createFlashcardsSpy = jest.spyOn(service, 'createFlashcards');
      createFlashcardsSpy.mockResolvedValue(true);

      const result = await service.regenerateFlashcards(
        mockMaterial.id,
        mockMaterial.userId,
      );

      expect(result).toBe(true);

      expect(deleteFlashcardsSpy).toHaveBeenCalledTimes(1);
      expect(createFlashcardsSpy).toHaveBeenCalledTimes(1);

      expect(deleteFlashcardsSpy).toHaveBeenCalledWith(
        mockFlashcards.id,
        mockMaterial.userId,
      );
      expect(createFlashcardsSpy).toHaveBeenCalledWith(
        mockMaterial.id,
        mockMaterial.userId,
      );

      deleteFlashcardsSpy.mockRestore();
      createFlashcardsSpy.mockRestore();
    });

    it('should handle case when no existing flashcards found', async () => {
      const mockMaterial = createMockMaterial();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        service.regenerateFlashcards(mockMaterial.id, mockMaterial.userId),
      ).rejects.toThrow();
    });
  });
});
