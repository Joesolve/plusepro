import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

// Mock Stripe before importing the service
const mockStripeInstance = {
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  subscriptions: {
    cancel: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => {
  const MockStripe = jest.fn().mockImplementation(() => mockStripeInstance);
  return { __esModule: true, default: MockStripe };
});

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: PrismaService;
  let config: ConfigService;

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
    },
    subscription: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_fake',
        STRIPE_WEBHOOK_SECRET: 'whsec_fake',
        FRONTEND_URL: 'http://localhost:3000',
      };
      return values[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    prisma = module.get<PrismaService>(PrismaService);
    config = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSubscription', () => {
    it('should return the subscription for a tenant', async () => {
      const expected = {
        id: 'sub-1',
        tenantId: 'tenant-1',
        plan: 'GROWTH',
        status: 'ACTIVE',
        maxEmployees: 100,
      };
      mockPrismaService.subscription.findFirst.mockResolvedValue(expected);

      const result = await service.getSubscription('tenant-1');

      expect(result).toEqual(expected);
      expect(mockPrismaService.subscription.findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
      });
    });

    it('should return null when no subscription exists', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue(null);

      const result = await service.getSubscription('tenant-1');

      expect(result).toBeNull();
    });
  });

  describe('getBillingOverview', () => {
    it('should return billing overview with MRR and tenant details', async () => {
      const subscriptions = [
        {
          id: 'sub-1',
          tenantId: 'tenant-1',
          plan: 'GROWTH',
          status: 'ACTIVE',
          maxEmployees: 100,
          stripeCustomerId: 'cus_1',
          stripeSubscriptionId: 'sub_stripe_1',
          tenant: { name: 'Acme Corp', slug: 'acme', _count: { users: 25 } },
        },
        {
          id: 'sub-2',
          tenantId: 'tenant-2',
          plan: 'STARTER',
          status: 'ACTIVE',
          maxEmployees: 25,
          stripeCustomerId: 'cus_2',
          stripeSubscriptionId: 'sub_stripe_2',
          tenant: { name: 'Beta Inc', slug: 'beta', _count: { users: 10 } },
        },
        {
          id: 'sub-3',
          tenantId: 'tenant-3',
          plan: 'SCALE',
          status: 'CANCELED',
          maxEmployees: 500,
          stripeCustomerId: 'cus_3',
          stripeSubscriptionId: 'sub_stripe_3',
          tenant: { name: 'Gamma LLC', slug: 'gamma', _count: { users: 50 } },
        },
      ];
      mockPrismaService.subscription.findMany.mockResolvedValue(subscriptions);

      const result = await service.getBillingOverview();

      // MRR = GROWTH (149) + STARTER (49) = 198 (CANCELED is excluded)
      expect(result.mrr).toBe(198);
      expect(result.totalTenants).toBe(3);
      expect(result.activeTenants).toBe(2);
      expect(result.tenants).toHaveLength(3);
      expect(result.tenants[0]).toEqual({
        tenantId: 'tenant-1',
        tenantName: 'Acme Corp',
        slug: 'acme',
        plan: 'GROWTH',
        status: 'ACTIVE',
        userCount: 25,
        seatLimit: 100,
      });
    });

    it('should return zero MRR when no active subscriptions exist', async () => {
      const subscriptions = [
        {
          id: 'sub-1',
          tenantId: 'tenant-1',
          plan: 'GROWTH',
          status: 'CANCELED',
          maxEmployees: 100,
          tenant: { name: 'Acme Corp', slug: 'acme', _count: { users: 5 } },
        },
      ];
      mockPrismaService.subscription.findMany.mockResolvedValue(subscriptions);

      const result = await service.getBillingOverview();

      expect(result.mrr).toBe(0);
      expect(result.activeTenants).toBe(0);
      expect(result.totalTenants).toBe(1);
    });

    it('should return empty overview when no subscriptions exist', async () => {
      mockPrismaService.subscription.findMany.mockResolvedValue([]);

      const result = await service.getBillingOverview();

      expect(result).toEqual({
        mrr: 0,
        totalTenants: 0,
        activeTenants: 0,
        tenants: [],
      });
    });
  });

  describe('cancelSubscription', () => {
    it('should throw BadRequestException when no subscription exists', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue(null);

      await expect(service.cancelSubscription('tenant-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when subscription has no stripeSubscriptionId', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        tenantId: 'tenant-1',
        stripeSubscriptionId: null,
      });

      await expect(service.cancelSubscription('tenant-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should cancel stripe subscription and update database', async () => {
      const subscription = {
        id: 'sub-1',
        tenantId: 'tenant-1',
        stripeSubscriptionId: 'sub_stripe_1',
      };
      mockPrismaService.subscription.findFirst.mockResolvedValue(subscription);
      mockPrismaService.subscription.update.mockResolvedValue({
        ...subscription,
        status: 'CANCELED',
        plan: 'STARTER',
      });

      // Access the stripe mock via the service
      const stripeMock = (service as any).stripe;
      stripeMock.subscriptions.cancel.mockResolvedValue({ id: 'sub_stripe_1', status: 'canceled' });

      const result = await service.cancelSubscription('tenant-1');

      expect(result).toEqual({ canceled: true });
      expect(stripeMock.subscriptions.cancel).toHaveBeenCalledWith('sub_stripe_1');
      expect(mockPrismaService.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: 'CANCELED', plan: 'STARTER' },
      });
    });
  });

  describe('createCheckoutSession', () => {
    it('should throw BadRequestException when tenant is not found', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.createCheckoutSession('tenant-1', 'GROWTH')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid plan', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        name: 'Acme',
        subscription: null,
      });

      await expect(service.createCheckoutSession('tenant-1', 'INVALID_PLAN')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create a checkout session for a valid plan', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        name: 'Acme',
        subscription: null,
      });

      const stripeMock = (service as any).stripe;
      stripeMock.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/session/123',
      });

      const result = await service.createCheckoutSession('tenant-1', 'GROWTH');

      expect(result).toEqual({ url: 'https://checkout.stripe.com/session/123' });
      expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          payment_method_types: ['card'],
          metadata: { tenantId: 'tenant-1', plan: 'GROWTH' },
        }),
      );
    });
  });

  describe('handleWebhook', () => {
    it('should throw BadRequestException for invalid webhook signature', async () => {
      const stripeMock = (service as any).stripe;
      stripeMock.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        service.handleWebhook(Buffer.from('payload'), 'bad-signature'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle checkout.session.completed event', async () => {
      const stripeMock = (service as any).stripe;
      stripeMock.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { tenantId: 'tenant-1', plan: 'GROWTH' },
            customer: 'cus_123',
            subscription: 'sub_456',
          },
        },
      });
      mockPrismaService.subscription.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.handleWebhook(Buffer.from('payload'), 'valid-sig');

      expect(result).toEqual({ received: true });
      expect(mockPrismaService.subscription.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        data: {
          plan: 'GROWTH',
          status: 'ACTIVE',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_456',
        },
      });
    });

    it('should handle customer.subscription.deleted event', async () => {
      const stripeMock = (service as any).stripe;
      stripeMock.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: { id: 'sub_456' },
        },
      });
      mockPrismaService.subscription.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.handleWebhook(Buffer.from('payload'), 'valid-sig');

      expect(result).toEqual({ received: true });
      expect(mockPrismaService.subscription.updateMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_456' },
        data: { status: 'CANCELED', plan: 'STARTER' },
      });
    });

    it('should handle invoice.payment_failed event', async () => {
      const stripeMock = (service as any).stripe;
      stripeMock.webhooks.constructEvent.mockReturnValue({
        type: 'invoice.payment_failed',
        data: {
          object: { subscription: 'sub_789' },
        },
      });
      mockPrismaService.subscription.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.handleWebhook(Buffer.from('payload'), 'valid-sig');

      expect(result).toEqual({ received: true });
      expect(mockPrismaService.subscription.updateMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_789' },
        data: { status: 'PAST_DUE' },
      });
    });
  });
});
