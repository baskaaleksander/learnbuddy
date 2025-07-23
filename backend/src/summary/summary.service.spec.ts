import { Test, TestingModule } from '@nestjs/testing';
import { SummaryService } from './summary.service';
import { OpenAiService } from '../open-ai/open-ai.service';
import { BillingService } from '../billing/billing.service';
import { parsePublicPdfFromS3 } from '../helpers/parse-pdf';

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
});
