import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';

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
    it.todo('should return flashcard stats for a given material and user');
    it.todo('should throw UnauthorizedException if material access is denied');
    it.todo('should return zero stats if no AI output exists');
  });
  describe('getUserStats', () => {
    it.todo('should return user stats');
    it.todo('should throw UnauthorizedException if user does not exist');
  });
  describe('getMaterialsCount', () => {
    it.todo('should return materials count');
    it.todo('should throw UnauthorizedException if user does not exist');
  });
  describe('getFlashcardUserStats', () => {
    it.todo('should return flashcard user stats');
    it.todo('should throw UnauthorizedException if user does not exist');
  });
});
