import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { RedisService } from 'src/redis/redis.service';

@Module({
  providers: [UserResolver, UserService, RedisService],
})
export class UserModule {}
