import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class SubscriptionsService {
    private prisma;
    private config;
    private stripe;
    constructor(prisma: PrismaService, config: ConfigService);
    createCheckoutSession(tenantId: string, plan: string): Promise<{
        url: string | null;
    }>;
    handleWebhook(payload: Buffer, signature: string): Promise<{
        received: boolean;
    }>;
    cancelSubscription(tenantId: string): Promise<{
        canceled: boolean;
    }>;
    getBillingOverview(): Promise<{
        mrr: number;
        totalTenants: number;
        activeTenants: number;
        seatUtilization: {
            tenantId: string;
            tenantName: string;
            plan: import(".prisma/client").$Enums.SubscriptionPlan;
            currentEmployees: number;
            maxEmployees: number;
            utilization: number;
        }[];
    }>;
    getSubscription(tenantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        stripeCustomerId: string | null;
        stripeSubscriptionId: string | null;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        maxEmployees: number;
        currentPeriodStart: Date | null;
        currentPeriodEnd: Date | null;
        cancelAtPeriodEnd: boolean;
    } | null>;
}
