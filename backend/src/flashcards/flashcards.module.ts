import { Module } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { FlashcardsResolver } from './flashcards.resolver';
import { OpenAiModule } from 'src/open-ai/open-ai.module';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  providers: [FlashcardsService, FlashcardsResolver],
  imports: [OpenAiModule, BillingModule],
})
export class FlashcardsModule {}
