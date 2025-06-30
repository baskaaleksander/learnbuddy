import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { WebhookService } from './webhook.service';

@Module({
  providers: [BillingService, WebhookService],
  controllers: [BillingController],
})
export class BillingModule {}
