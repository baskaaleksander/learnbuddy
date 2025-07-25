import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Drizzle } from 'drizzle-orm';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { RedisService } from '../redis/redis.service';
import { Logger } from '../logger/logger.service';
import { ScheduledTaskService } from '../scheduled-task/scheduled-task.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [/* Module containing JwtService */],
      providers: [
        AuthService,
        JwtService,
        Drizzle,
        EmailService,
        UserService,
        RedisService,
        Logger,
        ScheduledTaskService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});