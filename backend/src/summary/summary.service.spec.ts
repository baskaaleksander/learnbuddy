import { Test, TestingModule } from '@nestjs/testing';
import { SummaryService } from './summary.service';
import { OpenAiService } from '../open-ai/open-ai.service';
import { BillingService } from '../billing/billing.service';
import { parsePublicPdfFromS3 } from '../helpers/parse-pdf';
import {
  createMockMaterial,
  createMockSummary,
} from '../../test/helpers/test-data.helper';
import { NotFoundException } from '@nestjs/common';

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
      const mockMaterial = createMockMaterial();
      const mockSummary1 = createMockSummary();
      const mockSummary2 = { ...createMockSummary(), id: 'summary-2' };

      const summariesResult = [
        { ai_outputs: mockSummary1, materials: mockMaterial },
        { ai_outputs: mockSummary2, materials: mockMaterial },
      ];

      const countResult = [{ count: 15 }];

      const createChainableMock = (finalResult: any, isCount = false) => {
        const chainMock = {
          select: jest.fn(),
          from: jest.fn(),
          innerJoin: jest.fn(),
          where: jest.fn(),
          orderBy: jest.fn(),
          limit: jest.fn(),
          offset: jest.fn(),
        };

        Object.entries(chainMock).forEach(([_, fn]) => {
          fn.mockReturnValue(chainMock);
        });

        if (isCount) {
          chainMock.where.mockResolvedValue(finalResult);
        } else {
          chainMock.offset.mockResolvedValue(finalResult);
        }

        return chainMock;
      };

      let call = 0;
      mockDrizzle.select.mockImplementation(() =>
        call++ === 0
          ? createChainableMock(summariesResult)
          : createChainableMock(countResult, true),
      );

      const result = await service.getSummariesByUser(
        'user-1',
        2,
        5,
        'createdAt-desc',
      );

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockSummary1.id,
            chaptersCount: mockSummary1.content.chapters.length,
            bulletPointsCount: expect.any(Number),
            title: mockSummary1.content.title,
            material: expect.objectContaining({
              id: mockMaterial.id,
              title: mockMaterial.title,
            }),
          }),
          expect.objectContaining({
            id: mockSummary2.id,
            chaptersCount: mockSummary2.content.chapters.length,
            bulletPointsCount: expect.any(Number),
            title: mockSummary2.content.title,
            material: expect.objectContaining({
              id: mockMaterial.id,
              title: mockMaterial.title,
            }),
          }),
        ]),
        totalItems: 15,
        totalPages: 3,
        currentPage: 2,
        pageSize: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      });

      expect(mockDrizzle.select).toHaveBeenCalledTimes(2);
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
      const mockMaterial = createMockMaterial();
      const mockSummary1 = createMockSummary();
      const mockSummary2 = {
        ...createMockSummary(),
        id: 'summary-2',
        createdAt: new Date('2023-01-02'),
      };

      const summariesResult = [
        { ai_outputs: mockSummary1, materials: mockMaterial },
        { ai_outputs: mockSummary2, materials: mockMaterial },
      ];

      const countResult = [{ count: 15 }];

      const createChainableMock = (finalResult: any, isCount = false) => {
        const chainMock = {
          select: jest.fn(),
          from: jest.fn(),
          innerJoin: jest.fn(),
          where: jest.fn(),
          orderBy: jest.fn(),
          limit: jest.fn(),
          offset: jest.fn(),
        };

        Object.entries(chainMock).forEach(([_, fn]) => {
          fn.mockReturnValue(chainMock);
        });

        if (isCount) {
          chainMock.where.mockResolvedValue(finalResult);
        } else {
          chainMock.offset.mockResolvedValue(finalResult);
        }

        return chainMock;
      };

      let call = 0;
      mockDrizzle.select.mockImplementation(() =>
        call++ === 0
          ? createChainableMock(summariesResult)
          : createChainableMock(countResult, true),
      );

      const result = await service.getSummariesByUser(
        'user-1',
        2,
        5,
        'createdAt-desc',
      );
      expect(result.data[0].createdAt).toBe(mockSummary1.createdAt);
      expect(result.data[1].createdAt).toBe(mockSummary2.createdAt);
    });
    it('should respect page size parameter', async () => {
      const mockSummaries = Array.from({ length: 10 }, (_, i) => ({
        ai_outputs: {
          ...createMockSummary(),
          id: `summary-${i + 1}`,
        },
        materials: createMockMaterial(),
      }));

      const countResult = [{ count: 10 }];

      const createChainableMock = (finalResult: any, isCount = false) => {
        const chainMock = {
          select: jest.fn(),
          from: jest.fn(),
          innerJoin: jest.fn(),
          where: jest.fn(),
          orderBy: jest.fn(),
          limit: jest.fn(),
          offset: jest.fn(),
        };

        Object.entries(chainMock).forEach(([_, fn]) => {
          fn.mockReturnValue(chainMock);
        });

        if (isCount) {
          chainMock.where.mockResolvedValue(finalResult);
        } else {
          chainMock.offset.mockResolvedValue(finalResult);
        }

        return chainMock;
      };

      let call = 0;
      mockDrizzle.select.mockImplementation(() =>
        call++ === 0
          ? createChainableMock(mockSummaries)
          : createChainableMock(countResult, true),
      );

      const result = await service.getSummariesByUser(
        'user-1',
        1,
        10,
        'createdAt-desc',
      );

      expect(result.data).toHaveLength(10);
      expect(result.data[0].id).toBe('summary-1');
      expect(result.data[9].id).toBe('summary-10');
    });
    it('should correctly calculate chapters count and bullet points count', async () => {
      const mockSummary = createMockSummary();
      const mockMaterial = createMockMaterial();

      const summariesResult = [
        { ai_outputs: mockSummary, materials: mockMaterial },
      ];

      const countResult = [{ count: 1 }];

      const createChainableMock = (finalResult: any, isCount = false) => {
        const chainMock = {
          select: jest.fn(),
          from: jest.fn(),
          innerJoin: jest.fn(),
          where: jest.fn(),
          orderBy: jest.fn(),
          limit: jest.fn(),
          offset: jest.fn(),
        };

        Object.entries(chainMock).forEach(([_, fn]) => {
          fn.mockReturnValue(chainMock);
        });

        if (isCount) {
          chainMock.where.mockResolvedValue(finalResult);
        } else {
          chainMock.offset.mockResolvedValue(finalResult);
        }

        return chainMock;
      };

      let call = 0;
      mockDrizzle.select.mockImplementation(() =>
        call++ === 0
          ? createChainableMock(summariesResult)
          : createChainableMock(countResult, true),
      );

      const result = await service.getSummariesByUser(
        'user-1',
        1,
        10,
        'createdAt-desc',
      );

      expect(result.data[0].chaptersCount).toBe(
        mockSummary.content.chapters.length,
      );
      expect(result.data[0].bulletPointsCount).toBe(
        mockSummary.content.chapters.reduce(
          (acc, chapter) => acc + chapter.bullet_points.length,
          0,
        ),
      );
    });
    it('should handle invalid sort parameters', async () => {
      await expect(
        service.getSummariesByUser('user-1', 1, 10, 'invalid-sort'),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.getSummariesByUser('user-1', 1, 10, 'invalid-sort'),
      ).rejects.toThrow('Invalid sortBy parameter');
    });
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
