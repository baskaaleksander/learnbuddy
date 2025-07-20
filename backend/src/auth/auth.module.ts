import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from 'src/email/email.module';
import { RedisService } from '../redis/redis.service';
import { UserService } from '../user/user.service';
import { ScheduledTaskService } from 'src/scheduled-task/scheduled-task.service';
import { BillingService } from 'src/billing/billing.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
    EmailModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    RedisService,
    UserService,
    ScheduledTaskService,
    BillingService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
