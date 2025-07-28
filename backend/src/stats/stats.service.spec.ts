import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import {
  createMockAIOutput,
  createMockFlaschardsAiOutput,
  createMockFlashcard,
  createMockFlashcardProgress,
  createMockMaterial,
  createMockUser,
} from '../../test/helpers/test-data.helper';
import { UnauthorizedException } from '@nestjs/common';

describe('StatsService', () => {
  let service: StatsService;
  let mockDrizzle: any;

  beforeEach(async () => {
    mockDrizzle = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      and: jest.fn().mockReturnThis(),
      desc: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [StatsService, { provide: 'DRIZZLE', useValue: mockDrizzle }],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('getFlashcardStats', () => {
    it('should return flashcard stats for a given material and user', async () => {
      const mockMaterial = createMockMaterial();
      const createMockAIOutput = createMockFlaschardsAiOutput();
      const mockFlashcards = [
        {
          flashcards: createMockFlashcard(),
          flashcard_progress: createMockFlashcardProgress('known'),
        },
        {
          flashcards: createMockFlashcard(),
          flashcard_progress: createMockFlashcardProgress('review'),
        },
        {
          flashcards: createMockFlashcard(),
          flashcard_progress: createMockFlashcardProgress('known'),
        },
      ];
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([createMockAIOutput]),
      });
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(mockFlashcards),
      });

      const result = await service.getFlashcardStats(
        mockMaterial.id,
        mockMaterial.userId,
      );
      expect(result).toEqual({
        aiOutputId: createMockAIOutput.id,
        total: 3,
        known: 2,
        review: 1,
        lastUpdated: expect.any(Date),
      });
    });
    it('should throw UnauthorizedException if material access is denied', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });
      await expect(
        service.getFlashcardStats('materialId', 'userId'),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('should return zero stats if no AI output exists', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ materialId: 'test123' }]),
      });
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });
      const stats = await service.getFlashcardStats('materialId', 'userId');
      expect(stats).toEqual({
        total: 0,
        known: 0,
        review: 0,
        lastUpdated: expect.any(Date),
      });
    });
  });
  describe('getUserStats', () => {
    it.todo('should return user stats');
    it('should throw UnauthorizedException if user does not exist', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });
      await expect(service.getUserStats('userId')).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('should return empty stats if no materials exist for user', async () => {
      const mockUser = createMockUser();
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockUser]),
      });
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });
      const stats = await service.getUserStats(mockUser.id);
      expect(stats).toEqual({
        flashcardsCount: 0,
        materialsCount: 0,
        quizzesCount: 0,
        recentlyCreatedMaterials: [],
        recentlyCreatedAiOutputs: [],
        summariesCount: 0,
        totalFlashcardsKnown: 0,
        totalFlashcardsToReview: 0,
        totalQuizResults: 0,
      });
    });
  });
});
