import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { WebhookService } from './webhook.service';
import { RedisService } from 'src/redis/redis.service';

@Module({
  providers: [BillingService, WebhookService, RedisService],
  controllers: [BillingController],
  exports: [BillingService, WebhookService, RedisService],
})
export class BillingModule {}
