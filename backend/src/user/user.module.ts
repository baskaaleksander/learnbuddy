import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { RedisService } from 'src/redis/redis.service';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  providers: [UserResolver, UserService, RedisService],
  imports: [BillingModule],
})
export class UserModule {}
