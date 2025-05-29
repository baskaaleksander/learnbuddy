import { Module } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { FlashcardsResolver } from './flashcards.resolver';

@Module({
  providers: [FlashcardsService, FlashcardsResolver]
})
export class FlashcardsModule {}
