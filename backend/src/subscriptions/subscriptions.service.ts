import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService, private config: ConfigService) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(key || '', { apiVersion: '2023-10-16' as any });
  }

  async createCheckoutSession(tenantId: string, plan: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, include: { subscription: true } });
    if (!tenant) throw new BadRequestException('Tenant not found');

    const prices: Record<string, { price: number; name: string }> = {
      STARTER: { price: 4900, name: 'Starter' },
      GROWTH: { price: 14900, name: 'Growth' },
      SCALE: { price: 34900, name: 'Scale' },
    };
    const selected = prices[plan];
    if (!selected) throw new BadRequestException('Invalid plan');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'usd', product_data: { name: `PulsePro ${selected.name}` }, unit_amount: selected.price, recurring: { interval: 'month' } }, quantity: 1 }],
      metadata: { tenantId, plan },
      success_url: `${this.config.get('FRONTEND_URL')}/settings/billing?success=true`,
      cancel_url: `${this.config.get('FRONTEND_URL')}/settings/billing?canceled=true`,
    });

    return { url: session.url };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret || '');
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;
        const plan = session.metadata?.plan;
        if (tenantId && plan) {
          await this.prisma.subscription.updateMany({
            where: { tenantId },
            data: { plan: plan as any, status: 'ACTIVE', stripeCustomerId: session.customer as string, stripeSubscriptionId: session.subscription as string },
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'CANCELED', plan: 'STARTER' },
        });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if ((invoice as any).subscription) {
          await this.prisma.subscription.updateMany({
            where: { stripeSubscriptionId: (invoice as any).subscription as string },
            data: { status: 'PAST_DUE' },
          });
        }
        break;
      }
    }

    return { received: true };
  }

  async cancelSubscription(tenantId: string) {
    const sub = await this.prisma.subscription.findFirst({ where: { tenantId } });
    if (!sub?.stripeSubscriptionId) throw new BadRequestException('No active subscription');
    await this.stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    await this.prisma.subscription.update({ where: { id: sub.id }, data: { status: 'CANCELED', plan: 'STARTER' } });
    return { canceled: true };
  }

  async getBillingOverview() {
    const subs = await this.prisma.subscription.findMany({ include: { tenant: { select: { name: true, slug: true, _count: { select: { users: true } } } } } });
    const planPrices: Record<string, number> = { STARTER: 49, GROWTH: 149, SCALE: 349 };
    const mrr = subs.filter((s) => s.status === 'ACTIVE').reduce((sum, s) => sum + (planPrices[s.plan] || 0), 0);
    return {
      mrr,
      totalTenants: subs.length,
      activeTenants: subs.filter((s) => s.status === 'ACTIVE').length,
      seatUtilization: subs.map((s) => ({
        tenantId: s.tenantId,
        tenantName: s.tenant.name,
        plan: s.plan,
        currentEmployees: s.tenant._count.users,
        maxEmployees: s.maxEmployees,
        utilization: Math.round((s.tenant._count.users / s.maxEmployees) * 100),
      })),
    };
  }

  async getSubscription(tenantId: string) {
    return this.prisma.subscription.findFirst({ where: { tenantId } });
  }
}
