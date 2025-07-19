import { Module } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { SummaryResolver } from './summary.resolver';
import { OpenAiModule } from 'src/open-ai/open-ai.module';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  providers: [SummaryService, SummaryResolver],
  imports: [OpenAiModule, BillingModule],
})
export class SummaryModule {}
