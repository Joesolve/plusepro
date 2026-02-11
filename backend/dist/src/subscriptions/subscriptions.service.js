"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const stripe_1 = require("stripe");
let SubscriptionsService = class SubscriptionsService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        const key = this.config.get('STRIPE_SECRET_KEY');
        this.stripe = new stripe_1.default(key || '', { apiVersion: '2023-10-16' });
    }
    async createCheckoutSession(tenantId, plan) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, include: { subscription: true } });
        if (!tenant)
            throw new common_1.BadRequestException('Tenant not found');
        const prices = {
            STARTER: { price: 4900, name: 'Starter' },
            GROWTH: { price: 14900, name: 'Growth' },
            SCALE: { price: 34900, name: 'Scale' },
        };
        const selected = prices[plan];
        if (!selected)
            throw new common_1.BadRequestException('Invalid plan');
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
    async handleWebhook(payload, signature) {
        const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret || '');
        }
        catch {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const tenantId = session.metadata?.tenantId;
                const plan = session.metadata?.plan;
                if (tenantId && plan) {
                    await this.prisma.subscription.updateMany({
                        where: { tenantId },
                        data: { plan: plan, status: 'ACTIVE', stripeCustomerId: session.customer, stripeSubscriptionId: session.subscription },
                    });
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                await this.prisma.subscription.updateMany({
                    where: { stripeSubscriptionId: sub.id },
                    data: { status: 'CANCELED', plan: 'STARTER' },
                });
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                if (invoice.subscription) {
                    await this.prisma.subscription.updateMany({
                        where: { stripeSubscriptionId: invoice.subscription },
                        data: { status: 'PAST_DUE' },
                    });
                }
                break;
            }
        }
        return { received: true };
    }
    async cancelSubscription(tenantId) {
        const sub = await this.prisma.subscription.findFirst({ where: { tenantId } });
        if (!sub?.stripeSubscriptionId)
            throw new common_1.BadRequestException('No active subscription');
        await this.stripe.subscriptions.cancel(sub.stripeSubscriptionId);
        await this.prisma.subscription.update({ where: { id: sub.id }, data: { status: 'CANCELED', plan: 'STARTER' } });
        return { canceled: true };
    }
    async getBillingOverview() {
        const subs = await this.prisma.subscription.findMany({ include: { tenant: { select: { name: true, slug: true, _count: { select: { users: true } } } } } });
        const planPrices = { STARTER: 49, GROWTH: 149, SCALE: 349 };
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
    async getSubscription(tenantId) {
        return this.prisma.subscription.findFirst({ where: { tenantId } });
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, config_1.ConfigService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map