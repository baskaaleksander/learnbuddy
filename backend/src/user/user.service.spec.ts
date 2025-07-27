import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { MockDrizzle } from '../utils/types';
import { RedisService } from '../redis/redis.service';
import { BillingService } from '../billing/billing.service';
import {
  createMockAIOutput,
  createMockMaterial,
  createMockUser,
} from '../../test/helpers/test-data.helper';

describe('UserService', () => {
  let service: UserService;
  let mockDrizzle: MockDrizzle;
  let mockRedisService: any;
  let mockBillingService: any;

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

    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    mockBillingService = {
      cancelSubscription: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'DRIZZLE',
          useValue: mockDrizzle,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: BillingService,
          useValue: mockBillingService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteAccount', () => {
    it('should delete the user account with materials', async () => {
      const mockUser = createMockUser();
      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([mockUser]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([mockAIOutput]),
      });

      const result = await service.deleteAccount(mockUser.id);
      expect(result).toEqual(true);
      expect(mockDrizzle.delete).toHaveBeenCalledTimes(8);
    });
    it('should delete the user account without materials', async () => {
      const mockUser = createMockUser();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([mockUser]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      const result = await service.deleteAccount(mockUser.id);
      expect(result).toEqual(true);
      expect(mockDrizzle.delete).toHaveBeenCalledTimes(6);
    });
    it('should throw an error if user does not exist', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      await expect(service.deleteAccount('non-existent-id')).rejects.toThrow(
        'User not found',
      );
    });
    it('should cancel the subscription', async () => {
      const mockUser = createMockUser();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([mockUser]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      const result = await service.deleteAccount(mockUser.id);
      expect(mockBillingService.cancelSubscription).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
    it('should clear Redis cache', async () => {
      const mockUser = createMockUser();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([mockUser]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      const result = await service.deleteAccount(mockUser.id);
      expect(mockRedisService.delete).toHaveBeenCalledWith(
        `auth:me:${mockUser.id}`,
      );
    });
  });
  describe('changePassword', () => {
    it('should change the password successfully', async () => {
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

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      };
      mockDrizzle.update.mockReturnValueOnce(mockUpdateChain);

      const result = await service.changePassword(
        mockUserData.id,
        testPassword,
        'newPassword123',
      );

      expect(mockDrizzle.update).toHaveBeenCalledWith(expect.any(Object));
      expect(mockUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: expect.stringMatching(/^[a-f0-9]{16}\.[a-f0-9]{64}$/),
        }),
      );
      expect(result).toEqual(true);
    });
    it('should throw an error if old password is incorrect', async () => {
      const mockUserData = createMockUser();

      const testPassword = 'test123';
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
        service.changePassword(mockUserData.id, testPassword, 'newPassword'),
      ).rejects.toThrow('Old password is incorrect');
    });
    it('should throw an error if user does not exist', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      await expect(
        service.changePassword('non-existing-id', 'testtest', 'newPassword'),
      ).rejects.toThrow('User not found');
    });
    it('should clear Redis cache after change', async () => {
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

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      };
      mockDrizzle.update.mockReturnValueOnce(mockUpdateChain);

      await service.changePassword(
        mockUserData.id,
        testPassword,
        'newPassword123',
      );
      expect(mockRedisService.delete).toHaveBeenCalledWith(
        `auth:me:${mockUserData.id}`,
      );
    });
  });
  describe('getUserById', () => {
    it('should return the user by id', async () => {
      const mockUser = createMockUser();
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([mockUser]),
      });

      const result = await service.getUserById(mockUser.id);
      expect(result).toEqual(mockUser);
    });
    it('should throw an error if user does not exist', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      await expect(service.getUserById('non-existent-id')).rejects.toThrow(
        'User not found',
      );
    });
  });
  describe('updateUser', () => {
    it('should update the user', async () => {
      const mockUser = createMockUser();
      const mockNewEmail = 'newemail@example.com';
      const mockNewFirstName = 'New Name';

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([mockUser]),
      });

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      };
      mockDrizzle.update.mockReturnValueOnce(mockUpdateChain);

      const result = await service.updateUser(
        mockUser.id,
        mockNewEmail,
        mockNewFirstName,
      );

      expect(mockDrizzle.update).toHaveBeenCalledWith(expect.any(Object));
      expect(mockUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockNewEmail,
          firstName: mockNewFirstName,
        }),
      );
    });
    it('should throw an error if user does not exist', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([]),
      });

      await expect(
        service.updateUser(
          'non-existent-id',
          '<new-email>',
          '<new-first-name>',
        ),
      ).rejects.toThrow('User not found');
    });
    it('should clear Redis cache after update', async () => {
      const mockUser = createMockUser();
      const mockNewEmail = 'newemail@example.com';
      const mockNewFirstName = 'New Name';

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([mockUser]),
      });

      const result = await service.updateUser(
        mockUser.id,
        mockNewEmail,
        mockNewFirstName,
      );
      expect(mockRedisService.delete).toHaveBeenCalledWith(
        `auth:me:${mockUser.id}`,
      );
      expect(result).toEqual(true);
    });
    it('should handle partial updates correctly', async () => {
      const mockUser = createMockUser();
      const mockNewEmail = 'newemail@example.com';

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValueOnce([mockUser]),
      });

      const result = await service.updateUser(
        mockUser.id,
        mockNewEmail,
        undefined,
      );

      expect(mockDrizzle.update).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual(true);
    });
  });
});
