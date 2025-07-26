import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

jest.mock('stripe');
import Stripe from 'stripe';
import {
  createMockSubPlan,
  createMockUser,
} from '../../test/helpers/test-data.helper';
import { MockDrizzle } from '../utils/types';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockConfigService = {
  get: jest.fn(),
};

describe('BillingService', () => {
  let service: BillingService;
  let mockDrizzle: MockDrizzle;
  let mockRedisService: any;
  let stripeMock: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'STRIPE_SECRET_KEY':
          return 'sk_test_123';
        case 'FRONTEND_URL':
          return 'http://localhost:3000';
        default:
          return undefined;
      }
    });

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

    const mockStripeCheckoutSessions = {
      create: jest.fn(),
    };

    const mockStripeSubscriptions = {
      retrieve: jest.fn(),
      update: jest.fn(),
    };

    const mockStripeInvoices = {
      createPreview: jest.fn(),
    };

    stripeMock = {
      checkout: {
        sessions: mockStripeCheckoutSessions,
      },
      subscriptions: mockStripeSubscriptions,
      invoices: mockStripeInvoices,
    };

    (Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(
      () => stripeMock,
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: 'DRIZZLE', useValue: mockDrizzle },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for valid user without subscription', async () => {
      const mockUser = createMockUser();
      const mockPlan = createMockSubPlan();

      const mockUserQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([{ ...mockUser, stripeCustomerId: 'test-id' }]),
      };

      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };

      const mockPlanQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockPlan]),
      };

      const mockStripeSession = {
        id: 'cs_test_123',
        url: 'http://checkout.stripe.com/test-session',
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockSubQuery)
        .mockReturnValueOnce(mockPlanQuery);

      stripeMock.checkout.sessions.create.mockResolvedValue(mockStripeSession);

      const result = await service.createCheckoutSession(
        mockUser.email,
        mockPlan.name,
        mockPlan.interval,
      );

      expect(result).toEqual(mockStripeSession.url);
    });

    it('should create checkout session using existing Stripe customer ID', async () => {
      const mockUser = createMockUser();
      const mockPlan = createMockSubPlan();

      const mockUserQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([{ ...mockUser, stripeCustomerId: null }]),
      };

      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };

      const mockPlanQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockPlan]),
      };

      const mockStripeSession = {
        id: 'cs_test_123',
        url: 'http://checkout.stripe.com/test-session',
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockSubQuery)
        .mockReturnValueOnce(mockPlanQuery);

      stripeMock.checkout.sessions.create.mockResolvedValue(mockStripeSession);

      const result = await service.createCheckoutSession(
        mockUser.email,
        mockPlan.name,
        mockPlan.interval,
      );

      expect(result).toEqual(mockStripeSession.url);
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockUserQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };

      mockDrizzle.select.mockReturnValueOnce(mockUserQuery);

      await expect(
        service.createCheckoutSession(
          'nonexistent@example.com',
          'test-plan',
          'monthly',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when user has active subscription', async () => {
      const mockUser = createMockUser();
      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ status: 'active' }]),
      };

      const mockUserQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([{ ...mockUser, stripeCustomerId: 'test-id' }]),
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockSubQuery);

      await expect(
        service.createCheckoutSession(mockUser.email, 'test-plan', 'monthly'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when subscription not expired', async () => {
      const mockUser = createMockUser();
      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            status: 'active',
            endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          },
        ]),
      };

      const mockUserQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([{ ...mockUser, stripeCustomerId: 'test-id' }]),
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockSubQuery);

      await expect(
        service.createCheckoutSession(mockUser.email, 'test-plan', 'monthly'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when plan not found', async () => {
      const mockUser = createMockUser();

      const mockUserQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([{ ...mockUser, stripeCustomerId: null }]),
      };

      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockSubQuery)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([]),
        });

      await expect(
        service.createCheckoutSession(
          mockUser.email,
          'nonexistent-plan',
          'monthly',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow new checkout when subscription is expired', async () => {
      const mockUser = createMockUser();
      const mockPlan = createMockSubPlan();

      const mockUserQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([{ ...mockUser, stripeCustomerId: 'test-id' }]),
      };

      const mockPlanQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockPlan]),
      };

      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            status: 'past_due',
            endsAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
          },
        ]),
      };

      const mockStripeSession = {
        id: 'cs_test_123',
        url: 'http://checkout.stripe.com/test-session',
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockSubQuery)
        .mockReturnValueOnce(mockPlanQuery);

      stripeMock.checkout.sessions.create.mockResolvedValue(mockStripeSession);

      const result = await service.createCheckoutSession(
        mockUser.email,
        mockPlan.name,
        mockPlan.interval,
      );

      expect(result).toEqual(mockStripeSession.url);
    });

    it('should handle missing plan price_id', async () => {
      const mockUser = createMockUser();
      const mockPlan = createMockSubPlan();

      const mockUserQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([{ ...mockUser, stripeCustomerId: null }]),
      };

      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };

      const mockPlanQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ ...mockPlan, price_id: null }]),
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockSubQuery)
        .mockReturnValueOnce(mockPlanQuery);
      await expect(
        service.createCheckoutSession(
          mockUser.email,
          mockPlan.name,
          mockPlan.interval,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelSubscription', () => {
    it('should successfully cancel active subscription', async () => {
      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            stripeSubscriptionId: 'sub_test_123',
            status: 'active',
            endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          },
        ]),
      };

      mockDrizzle.select.mockReturnValueOnce(mockSubQuery);

      stripeMock.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_test_123',
        status: 'active',
      });

      stripeMock.subscriptions.update.mockResolvedValue({
        id: 'sub_test_123',
        status: 'canceled',
      });

      const result = await service.cancelSubscription('user-1');

      expect(mockDrizzle.update).toHaveBeenCalledWith(expect.anything());
      expect(mockDrizzle.update().set).toHaveBeenCalledWith({
        status: 'canceled',
      });

      expect(result).toEqual({
        id: 'sub_test_123',
        status: 'canceled',
      });
    });

    it('should throw NotFoundException when subscription not found in DB', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(service.cancelSubscription('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when Stripe subscription not found', async () => {
      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            stripeSubscriptionId: 'sub_test_123',
            status: 'active',
            endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          },
        ]),
      };

      mockDrizzle.select.mockReturnValueOnce(mockSubQuery);

      stripeMock.subscriptions.retrieve.mockResolvedValue(null);

      await expect(service.cancelSubscription('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when subscription already canceled', async () => {
      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            stripeSubscriptionId: 'sub_test_123',
            status: 'active',
            endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          },
        ]),
      };

      mockDrizzle.select.mockReturnValueOnce(mockSubQuery);

      stripeMock.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_test_123',
        status: 'canceled',
      });

      await expect(service.cancelSubscription('user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('useTokens', () => {
    it('should allow token usage for free user within 12 token limit', async () => {
      const mockUser = createMockUser();
      const mockUserQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      };
      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockSubQuery);

      const result = await service.useTokens(mockUser.id, 12);

      expect(result).toEqual(true);
    });

    it('should allow token usage for paid user within plan limit', async () => {
      const mockUser = createMockUser();
      const mockSubPlan = createMockSubPlan();
      const mockUserQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      };
      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            subscriptions: {
              status: 'past_due',
              endsAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
            },
            plans: mockSubPlan,
          },
        ]),
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockSubQuery);

      const result = await service.useTokens(
        mockUser.id,
        mockSubPlan.tokens_monthly,
      );

      expect(result).toEqual(true);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(service.useTokens('nonexistent-user', 5)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when free user exceeds 12 tokens', async () => {
      const mockUser = createMockUser();
      const mockUserQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      };
      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockSubQuery);

      await expect(service.useTokens(mockUser.id, 13)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when paid user exceeds plan limit', async () => {
      const mockUser = createMockUser();
      const mockSubPlan = createMockSubPlan();
      const mockUserQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      };
      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            subscriptions: {
              status: 'active',
              endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            },
            plans: mockSubPlan,
          },
        ]),
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockSubQuery);

      await expect(
        service.useTokens(mockUser.id, mockSubPlan.tokens_monthly + 1),
      ).rejects.toThrow(ConflictException);
    });

    it('should clear Redis cache after successful token usage', async () => {
      const mockUser = createMockUser();
      const mockSubPlan = createMockSubPlan();
      const mockUserQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      };
      const mockSubQuery = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            subscriptions: {
              status: 'past_due',
              endsAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
            },
            plans: mockSubPlan,
          },
        ]),
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockSubQuery);

      const result = await service.useTokens(
        mockUser.id,
        mockSubPlan.tokens_monthly,
      );

      expect(mockRedisService.delete).toHaveBeenCalledWith(
        `auth:me:${mockUser.id}`,
      );
    });
  });

  describe('updateSubscriptionPlan', () => {
    it('should successfully update to new plan', async () => {});

    it('should throw NotFoundException when user has no subscription', async () => {});

    it('should throw ConflictException when subscription not active', async () => {});

    it('should throw NotFoundException when new plan not found', async () => {});

    it('should throw ConflictException when user already has the same plan', async () => {});

    it('should handle missing new plan price_id', async () => {});

    it('should handle Stripe subscription not found', async () => {});
  });

  describe('getUserSubscriptionData', () => {
    it('should return subscription data for user with active subscription', async () => {});

    it('should return "Free" plan for user without subscription', async () => {});

    it('should handle null tokensUsed gracefully', async () => {});

    it('should convert price from cents to dollars', async () => {});
  });

  describe('getSubscriptionStatus', () => {
    it('should return subscription status for active user', async () => {});

    it('should throw NotFoundException when user has no subscription', async () => {});

    it('should throw ConflictException when subscription not active', async () => {});

    it('should throw NotFoundException when Stripe subscription not found', async () => {});
  });
});
