import { Test, TestingModule } from '@nestjs/testing';
import { FlashcardsResolver } from './flashcards.resolver';

describe('FlashcardsResolver', () => {
  let resolver: FlashcardsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlashcardsResolver],
    }).compile();

    resolver = module.get<FlashcardsResolver>(FlashcardsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
