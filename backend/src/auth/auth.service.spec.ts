import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { RedisService } from '../redis/redis.service';
import { Logger } from 'nestjs-pino';
import { ScheduledTaskService } from '../scheduled-task/scheduled-task.service';
import { JwtStrategy } from './jwt.strategy';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { createMockUser } from '../../test/helpers/test-data.helper';
import { MockDrizzle } from '../utils/types';

describe('AuthService', () => {
  let service: AuthService;
  let mockDrizzle: MockDrizzle;
  let mockEmailService: any;
  let mockUserService: any;
  let mockRedisService: any;
  let mockLogger: any;
  let mockScheduledTaskService: any;
  let mockJwtStrategy: any;
  let mockJwtService: any;

  beforeEach(async () => {
    mockDrizzle = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };

    mockEmailService = {
      sendEmail: jest.fn(),
    };

    mockUserService = {
      getUserById: jest.fn(),
    };

    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    mockScheduledTaskService = {
      scheduleTask: jest.fn(),
      cancelTask: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'DRIZZLE',
          useValue: mockDrizzle,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: ScheduledTaskService,
          useValue: mockScheduledTaskService,
        },
        {
          provide: JwtStrategy,
          useValue: mockJwtStrategy,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user with valid data', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      const mockNewUser = createMockUser();

      mockDrizzle.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([mockNewUser]),
      });

      mockScheduledTaskService.scheduleTask.mockResolvedValueOnce(undefined);
      mockEmailService.sendEmail.mockResolvedValueOnce(undefined);
      mockJwtService.sign.mockReturnValueOnce('mock-jwt-token');

      await service.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
      });

      expect(mockDrizzle.insert).toHaveBeenCalled();
    });
    it('should throw ConflictException when user already exists', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([{ email: 'test@example.com' }]),
      });
      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password',
          firstName: 'Test',
        }),
      ).rejects.toThrow(ConflictException);
    });
    it('should hash password correctly', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      const mockNewUser = createMockUser();

      const mockValues = jest.fn().mockReturnThis();
      const mockReturning = jest.fn().mockResolvedValueOnce([mockNewUser]);

      mockDrizzle.insert.mockReturnValueOnce({
        values: mockValues,
        returning: mockReturning,
      });

      mockScheduledTaskService.scheduleTask.mockResolvedValueOnce(undefined);
      mockEmailService.sendEmail.mockResolvedValueOnce(undefined);
      mockJwtService.sign.mockReturnValueOnce('mock-jwt-token');

      await service.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
      });

      expect(mockDrizzle.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith({
        email: 'test@example.com',
        passwordHash: expect.any(String),
        firstName: 'Test',
      });

      const insertCall = mockValues.mock.calls[0][0];
      expect(insertCall.passwordHash).toMatch(/^[a-f0-9]{16}\.[a-f0-9]{64}$/);
    });
    it('should return jwt token and user data on successful registration', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      const mockNewUser = createMockUser();

      mockDrizzle.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([mockNewUser]),
      });

      mockScheduledTaskService.scheduleTask.mockResolvedValueOnce(undefined);
      mockEmailService.sendEmail.mockResolvedValueOnce(undefined);
      mockJwtService.sign.mockReturnValueOnce('mock-jwt-token');

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
      });
      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        email: 'test@example.com',
        firstName: 'Test',
        id: '123',
        role: 'user',
        tokensUsed: 0,
      });
    });
    it('should schedule token reset task', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      const mockNewUser = createMockUser();

      mockDrizzle.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([mockNewUser]),
      });

      mockScheduledTaskService.scheduleTask.mockResolvedValueOnce(undefined);
      mockEmailService.sendEmail.mockResolvedValueOnce(undefined);
      mockJwtService.sign.mockReturnValueOnce('mock-jwt-token');

      await service.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
      });

      expect(mockScheduledTaskService.scheduleTask).toHaveBeenCalled();
    });
  });
  describe('login', () => {
    it('should log in a user with valid credentials', async () => {
      const mockUserData = createMockUser();

      const testPassword = 'password123';
      const salt = 'a1b2c3d4e5f6g7h8';
      const expectedHash =
        'ad5d06cfcbd4d7872c5f7dd88bcbebb9d191a00b1ac837116eacdcc21bdf5a41';
      const passwordHash = `${salt}.${expectedHash}`;

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockReturnValueOnce([{ ...mockUserData, passwordHash }]),
      });

      mockJwtService.sign.mockReturnValueOnce('mock-jwt-token');

      const result = await service.login({
        email: mockUserData.email,
        password: testPassword,
      });

      expect(result).toBeTruthy();
    });
    it('should throw ConflictException for invalid credentials', async () => {
      const mockUserData = createMockUser();

      const testPassword = 'wrongpassword';
      const salt = 'a1b2c3d4e5f6g7h8';
      const expectedHash =
        'ad5d06cfcbd4d7872c5f7dd88bcbebb9d191a00b1ac837116eacdcc21bdf5a41';
      const passwordHash = `${salt}.${expectedHash}`;

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockReturnValueOnce([{ ...mockUserData, passwordHash }]),
      });

      await expect(
        service.login({
          email: mockUserData.email,
          password: testPassword,
        }),
      ).rejects.toThrow(ConflictException);
    });
    it('should return jwt token and user data on successful login', async () => {
      const mockUserData = createMockUser();

      const testPassword = 'password123';
      const salt = 'a1b2c3d4e5f6g7h8';
      const expectedHash =
        'ad5d06cfcbd4d7872c5f7dd88bcbebb9d191a00b1ac837116eacdcc21bdf5a41';
      const passwordHash = `${salt}.${expectedHash}`;

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockReturnValueOnce([{ ...mockUserData, passwordHash }]),
      });

      mockJwtService.sign.mockReturnValueOnce('mock-jwt-token');

      const result = await service.login({
        email: mockUserData.email,
        password: testPassword,
      });

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        email: mockUserData.email,
        id: mockUserData.id,
        role: mockUserData.role,
        firstName: mockUserData.firstName,
        tokensUsed: mockUserData.tokensUsed,
      });
    });
    it('should throw ConflictException for non-existent user', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      await expect(
        service.login({
          email: 'non-existing-user@email.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
  describe('resetPassword', () => {
    it('should reset password for a valid user', async () => {
      const mockUserData = createMockUser();
      const mockPasswordReset = {
        userId: mockUserData.id,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockReturnValueOnce([
            { ...mockUserData, passwordReset: mockPasswordReset },
          ]),
      });
      mockDrizzle.update.mockReturnValueOnce({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([mockUserData]),
      });

      mockRedisService.get.mockResolvedValueOnce(null);
      mockRedisService.set.mockResolvedValueOnce(undefined);

      mockEmailService.sendEmail.mockResolvedValueOnce(undefined);

      const result = await service.resetPassword(
        mockPasswordReset.token,
        'new-password123',
      );
      expect(result).toEqual({
        message: 'Password reset successfully',
      });
    });
    it('should throw NotFoundException for invalid user', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      await expect(
        service.resetPassword('invalid-token', 'new-password123'),
      ).rejects.toThrow(NotFoundException);
    });
    it('should throw ConflictException for expired token', async () => {
      const mockPasswordReset = {
        userId: '123',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 3600000),
        used: false,
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([mockPasswordReset]),
      });

      await expect(
        service.resetPassword(mockPasswordReset.token, 'new-password123'),
      ).rejects.toThrow(ConflictException);
    });
    it('should mark token as used', async () => {
      const mockPasswordReset = {
        userId: '123',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([mockPasswordReset]),
      });

      const mockUserUpdate = jest.fn().mockReturnThis();
      const mockTokenUpdate = jest.fn().mockReturnThis();

      mockDrizzle.update
        .mockReturnValueOnce({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValueOnce([{ id: '123' }]),
        })
        .mockReturnValueOnce({
          set: mockTokenUpdate,
          where: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValueOnce([{ used: true }]),
        });

      await service.resetPassword('valid-token', 'new-password123');

      expect(mockDrizzle.update).toHaveBeenCalledTimes(2);
      expect(mockTokenUpdate).toHaveBeenCalledWith({ used: true });
    });
    it('should store new password securely', async () => {
      const mockPasswordReset = {
        userId: '123',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
      };

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([mockPasswordReset]),
      });

      const mockUserSet = jest.fn().mockReturnThis();
      mockDrizzle.update
        .mockReturnValueOnce({
          set: mockUserSet,
          where: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValueOnce([{ id: '123' }]),
        })
        .mockReturnValueOnce({
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValueOnce([{ used: true }]),
        });

      await service.resetPassword('valid-token', 'new-password123');

      expect(mockUserSet).toHaveBeenCalledWith({
        passwordHash: expect.stringMatching(/^[a-f0-9]{16}\.[a-f0-9]{64}$/),
      });
    });
  });
  describe('checkPasswordResetToken', () => {
    it('should validate password reset token', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([
          {
            id: '123',
            token: 'valid-token',
            expiresAt: new Date(Date.now() + 3600000),
            used: false,
          },
        ]),
      });

      const result = await service.checkPasswordResetToken('valid-token');

      expect(result).toEqual({
        message: 'Password reset token valid',
      });
    });
    it('should reject expired token', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([
          {
            id: '123',
            token: 'expired-token',
            expiresAt: new Date(Date.now() - 3600000),
            used: false,
          },
        ]),
      });

      await expect(
        service.checkPasswordResetToken('expired-token'),
      ).rejects.toThrow(ConflictException);
    });
    it('should throw NotFoundException for invalid user', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException for already verified email', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([
          {
            id: '123',
            email: 'test@example.com',
            emailVerified: true,
          },
        ]),
      });

      await expect(service.verifyEmail('valid-token')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should mark email as verified', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([
          {
            id: '123',
            email: 'test@example.com',
            emailVerified: false,
          },
        ]),
      });

      mockDrizzle.update.mockReturnValueOnce({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([
          {
            id: '123',
            email: 'test@example.com',
            emailVerified: true,
          },
        ]),
      });

      const result = await service.verifyEmail('valid-token');

      expect(result).toEqual({
        message: 'Email verified successfully',
      });
      expect(mockDrizzle.update).toHaveBeenCalled();
    });

    it('should send a password reset email for a valid user', async () => {
      const mockUser = createMockUser();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([mockUser]),
      });

      mockDrizzle.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([
          {
            id: 'reset-id',
            token: 'reset-token',
            userId: mockUser.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        ]),
      });

      mockEmailService.sendEmail.mockResolvedValueOnce(undefined);

      const result = await service.forgotPassword(mockUser.email);

      expect(result).toEqual({
        message: 'Password reset email sent',
      });
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        mockUser.email,
        'Password Reset',
        expect.stringContaining('reset-token'),
      );
    });

    it('should throw NotFoundException for invalid user', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      await expect(
        service.forgotPassword('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return user data for a valid user', async () => {
      const mockUser = createMockUser();

      mockRedisService.get.mockResolvedValueOnce(null);
      mockUserService.getUserById.mockResolvedValueOnce(mockUser);
      mockRedisService.set.mockResolvedValueOnce(undefined);

      const result = await service.getMe(mockUser.id);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        role: mockUser.role,
        tokensUsed: mockUser.tokensUsed,
      });
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `auth:me:${mockUser.id}`,
        expect.any(Object),
        300,
      );
    });

    it('should throw NotFoundException for invalid user', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      mockUserService.getUserById.mockRejectedValueOnce(
        new NotFoundException('User not found'),
      );

      await expect(service.getMe('invalid-user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return cached user data when available', async () => {
      const mockUser = createMockUser();
      const cachedData = {
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        role: mockUser.role,
        tokensUsed: mockUser.tokensUsed,
      };

      mockRedisService.get.mockResolvedValueOnce(cachedData);

      const result = await service.getMe(mockUser.id);

      expect(result).toEqual(cachedData);
      expect(mockUserService.getUserById).not.toHaveBeenCalled();
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });
    it('should return user data for a valid user', async () => {
      const mockUser = createMockUser();

      mockRedisService.get.mockResolvedValueOnce(null);
      mockUserService.getUserById.mockResolvedValueOnce(mockUser);
      mockRedisService.set.mockResolvedValueOnce(undefined);

      const result = await service.getMe(mockUser.id);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        role: mockUser.role,
        tokensUsed: mockUser.tokensUsed,
      });
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `auth:me:${mockUser.id}`,
        expect.any(Object),
        300,
      );
    });
    it('should throw NotFoundException for invalid user', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      mockUserService.getUserById.mockRejectedValueOnce(
        new NotFoundException('User not found'),
      );

      await expect(service.getMe('invalid-user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
    it('should return cached user data when available', async () => {
      const mockUser = createMockUser();
      const cachedData = {
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        role: mockUser.role,
        tokensUsed: mockUser.tokensUsed,
      };

      mockRedisService.get.mockResolvedValueOnce(cachedData);

      const result = await service.getMe(mockUser.id);

      expect(result).toEqual(cachedData);
      expect(mockUserService.getUserById).not.toHaveBeenCalled();
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });
  });
});
