import { Module } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { SummaryResolver } from './summary.resolver';
import { OpenAiModule } from '../open-ai/open-ai.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  providers: [SummaryService, SummaryResolver],
  imports: [OpenAiModule, BillingModule],
})
export class SummaryModule {}
