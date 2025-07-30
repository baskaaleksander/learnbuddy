import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { RedisService } from '../redis/redis.service';
import { BillingModule } from '../billing/billing.module';

@Module({
  providers: [UserResolver, UserService, RedisService],
  imports: [BillingModule],
})
export class UserModule {}
