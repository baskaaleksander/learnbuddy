import { Test, TestingModule } from '@nestjs/testing';
import { StatsResolver } from './stats.resolver';

describe('StatsResolver', () => {
  let resolver: StatsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatsResolver],
    }).compile();

    resolver = module.get<StatsResolver>(StatsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
