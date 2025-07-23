import { Test, TestingModule } from '@nestjs/testing';
import { SummaryService } from './summary.service';
import { OpenAiService } from '../open-ai/open-ai.service';
import { BillingService } from '../billing/billing.service';
import { parsePublicPdfFromS3 } from '../helpers/parse-pdf';
import {
  createMockMaterial,
  createMockSummary,
} from '../../test/helpers/test-data.helper';

jest.mock('../helpers/parse-pdf', () => ({
  parsePublicPdfFromS3: jest.fn(),
}));

describe('SummaryService', () => {
  let service: SummaryService;
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
      generateSummary: jest.fn(),
    };

    mockBillingService = {
      useTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummaryService,
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

    service = module.get<SummaryService>(SummaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSummariesByUser', () => {
    it('should return paginated summaries for user', async () => {
      const mockSummary = createMockSummary();
      const mockMaterial = createMockMaterial();

      const executeDataMock = jest.fn().mockResolvedValue([
        {
          ai_outputs: mockSummary,
          materials: mockMaterial,
        },
      ]);

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: executeDataMock,
      });

      const executeCountMock = jest.fn().mockResolvedValue([{ count: 1 }]);

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: executeCountMock,
      });

      const result = await service.getSummariesByUser(
        'user-1',
        1,
        10,
        'createdAt-desc',
      );

      const expectedSummary = {
        ...mockSummary,
        chaptersCount: mockSummary.content.chapters.length,
        title: mockSummary.content.title,
        bulletPointsCount: mockSummary.content.chapters.reduce(
          (total, chapter) => total + chapter.bullet_points.length,
          0,
        ),
        material: mockMaterial,
      };

      expect(result).toEqual({
        currentPage: 1,
        data: [expectedSummary],
        hasNextPage: false,
        hasPreviousPage: false,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
      });

      expect(executeDataMock).toHaveBeenCalledTimes(1);
      expect(executeCountMock).toHaveBeenCalledTimes(1);
    });
    it('should handle empty summaries', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([
          {
            ai_outputs: { content: { chapters: [] } },
            materials: createMockMaterial(),
          },
        ]),
      });

      const result = await service.getSummariesByUser(
        'user-1',
        1,
        10,
        'createdAt-desc',
      );

      expect(result).toEqual({
        currentPage: 1,
        data: [],
        hasNextPage: false,
        hasPreviousPage: false,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
      });
    });
    it('should sort summaries by createdAt in descending order', async () => {
      const mockSummary1 = createMockSummary();
      const mockSummary2 = createMockSummary();
      mockSummary2.createdAt = new Date(
        mockSummary1.createdAt.getTime() + 1000,
      );

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([
          { ai_outputs: mockSummary1, materials: createMockMaterial() },
          { ai_outputs: mockSummary2, materials: createMockMaterial() },
        ]),
      });

      const result = await service.getSummariesByUser(
        'user-1',
        1,
        10,
        'createdAt-desc',
      );

      expect(result.data[0].createdAt).toBe(mockSummary2.createdAt);
      expect(result.data[1].createdAt).toBe(mockSummary1.createdAt);
    });
    it('should respect page size parameter', async () => {
      const mockSummaries = Array.from({ length: 25 }, (_, i) => ({
        ...createMockSummary(),
        id: `summary-${i + 1}`,
      }));

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockSummaries),
      });

      const result = await service.getSummariesByUser(
        'user-1',
        1,
        10,
        'createdAt-desc',
      );

      expect(result.data).toHaveLength(10);
      expect(result.data[0].id).toBe('summary-25');
      expect(result.data[9].id).toBe('summary-16');
    });
    it('should correctly calculate chapters count and bullet points count', async () => {});
    it('should handle invalid sort parameters', async () => {});
  });
  describe('markChapterAsKnown', () => {
    it('should toggle chapter known status from false to true', async () => {});
    it('should toggle chapter known status from true to false', async () => {});
    it('should throw error for invalid chapter index', async () => {});
    it('should throw error for negative chapter index', async () => {});
    it('should throw error when user does not own the material', async () => {});
    it('should verify if database operations are called correctly', async () => {});
  });
  describe('getSummaryById', () => {
    it('should return summary when user owns the material', async () => {});
    it("should throw UnauthorizedException when user tries to access another user's material", async () => {});
    it("should throw NotFoundException when material doesn't exist", async () => {});
    it("should throw NotFoundException when summary doesn't exist", async () => {});
    it('should correctly count chapters and bullet points', async () => {});
  });
});
