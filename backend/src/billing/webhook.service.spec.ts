import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

jest.mock('stripe');
import Stripe from 'stripe';
import { MockDrizzle } from '../utils/types';
import { WebhookService } from './webhook.service';
import { ScheduledTaskService } from '../scheduled-task/scheduled-task.service';
import {
  createMockSubPlan,
  createMockSubscription,
  createMockUser,
} from '../../test/helpers/test-data.helper';

const mockConfigService = {
  get: jest.fn(),
};

describe('WebhookService', () => {
  let service: WebhookService;
  let mockDrizzle: MockDrizzle;
  let stripeMock: any;
  let mockScheduledTaskService: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'STRIPE_SECRET_KEY':
          return 'sk_test_123';
        case 'STRIPE_WEBHOOK_SECRET':
          return 'whsec_123';
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

    mockScheduledTaskService = {
      destroyTask: jest.fn(),
      scheduleTask: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: 'DRIZZLE', useValue: mockDrizzle },
        { provide: ScheduledTaskService, useValue: mockScheduledTaskService },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleCheckoutSessionCompleted', () => {
    it('new user with valid session creates a subscription', async () => {
      const mockSession = {
        customer_email: 'example@example.com',
        customer: 'cus_123',
        subscription: 'sub_123',
        metadata: {
          planName: 'tier1',
          planInterval: 'monthly',
        },
      } as unknown as Stripe.Checkout.Session;
      const mockUser = createMockUser();
      const mockPlan = createMockSubPlan();

      const mockSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      };
      mockDrizzle.select.mockReturnValue(mockSelectChain);

      const mockPlansSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockPlan]),
      };

      const mockSubSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockSelectChain)
        .mockReturnValueOnce(mockPlansSelectChain)
        .mockReturnValueOnce(mockSubSelectChain);

      const mockInsertChain = {
        values: jest.fn().mockResolvedValue([mockPlan]),
      };
      mockDrizzle.insert.mockReturnValue(mockInsertChain);

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };
      mockDrizzle.update.mockReturnValue(mockUpdateChain);

      stripeMock.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_123',
        items: {
          data: [
            {
              current_period_end: Math.floor(Date.now() / 1000) + 2592000,
            },
          ],
        },
      });

      await service.handleCheckoutSessionCompleted(mockSession);
      expect(mockDrizzle.insert).toHaveBeenCalledTimes(1);
    });
    it('existing user with valid session updates subscription', async () => {
      const mockSession = {
        customer_email: 'example@example.com',
        customer: 'cus_123',
        subscription: 'sub_123',
        metadata: {
          planName: 'tier1',
          planInterval: 'monthly',
        },
      } as unknown as Stripe.Checkout.Session;
      const mockUser = createMockUser();
      const mockPlan = createMockSubPlan();
      const mockSubscription = createMockSubscription();

      const mockSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      };
      mockDrizzle.select.mockReturnValue(mockSelectChain);

      const mockPlansSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockPlan]),
      };

      const mockSubSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockSubscription]),
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockSelectChain)
        .mockReturnValueOnce(mockPlansSelectChain)
        .mockReturnValueOnce(mockSubSelectChain);

      const mockInsertChain = {
        values: jest.fn().mockResolvedValue([mockPlan]),
      };
      mockDrizzle.insert.mockReturnValue(mockInsertChain);

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };
      mockDrizzle.update.mockReturnValue(mockUpdateChain);

      stripeMock.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_123',
        items: {
          data: [
            {
              current_period_end: Math.floor(Date.now() / 1000) + 2592000,
            },
          ],
        },
      });

      await service.handleCheckoutSessionCompleted(mockSession);
      expect(mockDrizzle.update).toHaveBeenCalledTimes(3);
    });
    it('missing customer_email throws error', async () => {
      const mockSession = {
        customer_email: null,
        customer: 'cus_123',
        subscription: 'sub_123',
        metadata: {
          planName: 'tier1',
          planInterval: 'monthly',
        },
      } as unknown as Stripe.Checkout.Session;

      await expect(
        service.handleCheckoutSessionCompleted(mockSession),
      ).rejects.toThrow('Customer email is required for subscription creation');
    });
    it('user not found throws error', async () => {
      const mockSession = {
        customer_email: 'example@example.com',
        customer: 'cus_123',
        subscription: 'sub_123',
        metadata: {
          planName: 'tier1',
          planInterval: 'monthly',
        },
      } as unknown as Stripe.Checkout.Session;

      const mockSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };
      mockDrizzle.select.mockReturnValue(mockSelectChain);

      await expect(
        service.handleCheckoutSessionCompleted(mockSession),
      ).rejects.toThrow(
        `User with email ${mockSession.customer_email} not found`,
      );
    });
    it('missing plan name or interval throws error', async () => {
      const mockSession = {
        customer_email: 'example@example.com',
        customer: 'cus_123',
        subscription: 'sub_123',
        metadata: {
          planName: null,
          planInterval: 'monthly',
        },
      } as unknown as Stripe.Checkout.Session;
      const mockUser = createMockUser();

      const mockSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      };
      mockDrizzle.select.mockReturnValue(mockSelectChain);

      stripeMock.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_123',
        items: {
          data: [
            {
              current_period_end: Math.floor(Date.now() / 1000) + 2592000,
            },
          ],
        },
      });

      await expect(
        service.handleCheckoutSessionCompleted(mockSession),
      ).rejects.toThrow('Plan name and interval are required for subscription');
    });
    it('token reset scheduling works', async () => {
      const mockSession = {
        customer_email: 'example@example.com',
        customer: 'cus_123',
        subscription: 'sub_123',
        metadata: {
          planName: 'tier1',
          planInterval: 'monthly',
        },
      } as unknown as Stripe.Checkout.Session;
      const mockUser = createMockUser();
      const mockPlan = createMockSubPlan();

      const mockSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser]),
      };
      mockDrizzle.select.mockReturnValue(mockSelectChain);

      const mockPlansSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockPlan]),
      };

      const mockSubSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };

      mockDrizzle.select
        .mockReturnValueOnce(mockSelectChain)
        .mockReturnValueOnce(mockPlansSelectChain)
        .mockReturnValueOnce(mockSubSelectChain);

      const mockInsertChain = {
        values: jest.fn().mockResolvedValue([mockPlan]),
      };
      mockDrizzle.insert.mockReturnValue(mockInsertChain);

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };
      mockDrizzle.update.mockReturnValue(mockUpdateChain);

      stripeMock.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_123',
        items: {
          data: [
            {
              current_period_end: Math.floor(Date.now() / 1000) + 2592000,
            },
          ],
        },
      });

      await service.handleCheckoutSessionCompleted(mockSession);
      expect(mockScheduledTaskService.scheduleTask).toHaveBeenCalledWith(
        mockUser.id,
        'reset-tokens',
        expect.any(Date),
      );
    });
  });
  describe('handleCustomerSubscriptionDeleted', () => {
    it('valid subscription deletion updates user', async () => {
      const mockSubscriptionEvent = {
        id: 'sub_123',
      } as unknown as Stripe.Subscription;
      const mockSubscription = createMockSubscription();

      const mockSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockSubscription]),
      };
      mockDrizzle.select.mockReturnValue(mockSelectChain);

      await service.handleCustomerSubscriptionDeleted(mockSubscriptionEvent);
      expect(mockDrizzle.delete).toHaveBeenCalledTimes(1);
    });
    it('missing subscription ID throws error', async () => {
      const mockSubscriptionEvent = {
        id: null,
      } as unknown as Stripe.Subscription;

      await expect(
        service.handleCustomerSubscriptionDeleted(mockSubscriptionEvent),
      ).rejects.toThrow('Subscription ID is required for deletion');
    });
    it('non-existing subscription throws error', async () => {
      const mockSubscriptionEvent = {
        id: 'sub_123',
      } as unknown as Stripe.Subscription;

      const mockSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };

      mockDrizzle.select.mockReturnValue(mockSelectChain);

      await expect(
        service.handleCustomerSubscriptionDeleted(mockSubscriptionEvent),
      ).rejects.toThrow(
        `Subscription with ID ${mockSubscriptionEvent.id} not found`,
      );
    });
  });
  describe('handleInvoicePaid', () => {
    it('valid invoice payment updates user subscription', async () => {
      const mockInvoiceEvent = {
        lines: {
          data: [
            {
              parent: {
                subscription_item_details: {
                  subscription: 'sub_123',
                },
              },
            },
          ],
        },
      } as unknown as Stripe.Invoice;
      const mockStripeSubscription = {
        id: 'sub_123',
        items: {
          data: [
            {
              current_period_end: Math.floor(Date.now() / 1000) + 2592000,
            },
          ],
        },
      };
      const mockSubscription = createMockSubscription();

      const mockSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockSubscription]),
      };
      mockDrizzle.select.mockReturnValue(mockSelectChain);

      stripeMock.subscriptions.retrieve.mockResolvedValue(
        mockStripeSubscription,
      );

      await service.handleInvoicePaid(mockInvoiceEvent);
      expect(mockDrizzle.update).toHaveBeenCalledTimes(1);
    });
    it('current period end is set', async () => {
      const mockInvoiceEvent = {
        lines: {
          data: [
            {
              parent: {
                subscription_item_details: {
                  subscription: 'sub_123',
                },
              },
            },
          ],
        },
      } as unknown as Stripe.Invoice;
      const mockStripeSubscription = {
        id: 'sub_123',
        items: {
          data: [
            {
              current_period_end: Math.floor(Date.now() / 1000) + 2592000,
            },
          ],
        },
      };
      const mockSubscription = createMockSubscription();

      const mockSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockSubscription]),
      };
      mockDrizzle.select.mockReturnValue(mockSelectChain);

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };
      mockDrizzle.update.mockReturnValue(mockUpdateChain);

      stripeMock.subscriptions.retrieve.mockResolvedValue(
        mockStripeSubscription,
      );

      await service.handleInvoicePaid(mockInvoiceEvent);
      expect(mockUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPeriodEnd: expect.any(Date),
          status: 'active',
          updatedAt: expect.any(Date),
        }),
      );
    });
    it('missing subscription ID throws error', async () => {
      const mockInvoiceEvent = {
        lines: {
          data: [
            {
              parent: {
                subscription_item_details: {
                  subscription: null,
                },
              },
            },
          ],
        },
      } as unknown as Stripe.Invoice;

      await expect(service.handleInvoicePaid(mockInvoiceEvent)).rejects.toThrow(
        'Subscription ID is required for invoice payment',
      );
    });
    it('non-existing subscription throws error', async () => {
      const mockInvoiceEvent = {
        lines: {
          data: [
            {
              parent: {
                subscription_item_details: {
                  subscription: 'sub_999',
                },
              },
            },
          ],
        },
      } as unknown as Stripe.Invoice;

      const mockSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };
      mockDrizzle.select.mockReturnValue(mockSelectChain);

      await expect(service.handleInvoicePaid(mockInvoiceEvent)).rejects.toThrow(
        'Subscription with ID sub_999 not found',
      );
    });
  });
  describe('handleInvoicePaymentFailed', () => {
    it('valid invoice payment failure updates user', async () => {
      const mockInvoiceEvent = {
        lines: {
          data: [
            {
              parent: {
                subscription_item_details: {
                  subscription: 'sub_999',
                },
              },
            },
          ],
        },
      } as unknown as Stripe.Invoice;

      const mockSubscription = createMockSubscription();

      const mockSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockSubscription]),
      };
      mockDrizzle.select.mockReturnValue(mockSelectChain);

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };
      mockDrizzle.update.mockReturnValue(mockUpdateChain);
      await service.handleInvoicePaymentFailed(mockInvoiceEvent);

      expect(mockDrizzle.update).toHaveBeenCalledTimes(1);
      expect(mockUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'past_due',
        }),
      );
    });
    it('missing subscription ID throws error', async () => {
      const mockInvoiceEvent = {
        lines: {
          data: [
            {
              parent: {
                subscription_item_details: {
                  subscription: null,
                },
              },
            },
          ],
        },
      } as unknown as Stripe.Invoice;
      await expect(
        service.handleInvoicePaymentFailed(mockInvoiceEvent),
      ).rejects.toThrow('Subscription ID is required for invoice payment');
    });
    it('non-existing subscription throws error', async () => {
      const mockInvoiceEvent = {
        lines: {
          data: [
            {
              parent: {
                subscription_item_details: {
                  subscription: 'sub_999',
                },
              },
            },
          ],
        },
      } as unknown as Stripe.Invoice;

      const mockSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };
      mockDrizzle.select.mockReturnValue(mockSelectChain);

      await expect(
        service.handleInvoicePaymentFailed(mockInvoiceEvent),
      ).rejects.toThrow('Subscription with ID sub_999 not found');
    });
  });
  describe('processWebhookEvent', () => {
    it('each event type routes to correct handler', async () => {
      const mockEvent = {
        type: 'invoice.paid',
        data: {
          object: {
            id: 'in_123',
          },
        },
      } as unknown as Stripe.Event;

      jest.spyOn(service, 'handleInvoicePaid').mockResolvedValue();
      await service.processWebhookEvent(mockEvent);

      expect(service.handleInvoicePaid).toHaveBeenCalledWith(
        mockEvent.data.object,
      );
    });
    it('unknown event type throws error', async () => {
      const mockEvent = {
        type: 'unknown.event',
      } as unknown as Stripe.Event;

      await expect(service.processWebhookEvent(mockEvent)).rejects.toThrow(
        'Unhandled event type: unknown.event',
      );
    });
  });
  describe('verifyWebhookSignature', () => {
    it('valid signature returns event', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
          },
        },
      } as unknown as Stripe.Event;
      const mockPayload = Buffer.from(JSON.stringify(mockEvent));
      const mockSignature = 't=1234567890,v1=abcdefg';

      stripeMock.webhooks = {
        constructEvent: jest.fn().mockReturnValue(mockEvent),
      };

      const event = service.verifyWebhookSignature(mockPayload, mockSignature);
      expect(event).toEqual(mockEvent);
      expect(stripeMock.webhooks.constructEvent).toHaveBeenCalledWith(
        mockPayload,
        mockSignature,
        'whsec_123',
      );
    });

    it('invalid signature throws error', () => {
      const mockPayload = Buffer.from(JSON.stringify({}));
      const mockSignature = 't=1234567890,v1=invalid';

      stripeMock.webhooks = {
        constructEvent: jest.fn().mockImplementation(() => {
          throw new Error('Invalid signature');
        }),
      };

      expect(() =>
        service.verifyWebhookSignature(mockPayload, mockSignature),
      ).toThrow('Invalid signature');
    });

    it('missing webhook secret throws error', () => {
      mockConfigService.get.mockReturnValueOnce(undefined);

      expect(() =>
        service.verifyWebhookSignature(Buffer.from(''), 'signature'),
      ).toThrow('STRIPE_WEBHOOK_SECRET is not defined');
    });
  });
});
