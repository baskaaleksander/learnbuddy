import { Test, TestingModule } from '@nestjs/testing';
import { MaterialsResolver } from './materials.resolver';

describe('MaterialsResolver', () => {
  let resolver: MaterialsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaterialsResolver],
    }).compile();

    resolver = module.get<MaterialsResolver>(MaterialsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
