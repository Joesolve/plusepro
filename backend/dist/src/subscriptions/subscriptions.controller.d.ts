import { RawBodyRequest } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private service;
    constructor(service: SubscriptionsService);
    createCheckout(tenantId: string, plan: string): Promise<{
        url: string | null;
    }>;
    handleWebhook(req: RawBodyRequest<Request>, signature: string): Promise<{
        received: boolean;
    }>;
    cancel(tenantId: string): Promise<{
        canceled: boolean;
    }>;
    getCurrent(tenantId: string): Promise<{
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
}
