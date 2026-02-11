import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
export declare class TenantsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTenantDto): Promise<{
        subscription: {
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
        } | null;
        _count: {
            users: number;
        };
    } & {
        id: string;
        slug: string;
        domain: string | null;
        name: string;
        logoUrl: string | null;
        primaryColor: string;
        secondaryColor: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<({
        subscription: {
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
        } | null;
        _count: {
            users: number;
        };
    } & {
        id: string;
        slug: string;
        domain: string | null;
        name: string;
        logoUrl: string | null;
        primaryColor: string;
        secondaryColor: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        departments: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
        }[];
        subscription: {
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
        } | null;
        coreValues: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            isActive: boolean;
            description: string | null;
            sortOrder: number;
            iconUrl: string | null;
        }[];
        _count: {
            users: number;
        };
    } & {
        id: string;
        slug: string;
        domain: string | null;
        name: string;
        logoUrl: string | null;
        primaryColor: string;
        secondaryColor: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findBySlug(slug: string): Promise<{
        subscription: {
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
        } | null;
    } & {
        id: string;
        slug: string;
        domain: string | null;
        name: string;
        logoUrl: string | null;
        primaryColor: string;
        secondaryColor: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateTenantDto): Promise<{
        id: string;
        slug: string;
        domain: string | null;
        name: string;
        logoUrl: string | null;
        primaryColor: string;
        secondaryColor: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        slug: string;
        domain: string | null;
        name: string;
        logoUrl: string | null;
        primaryColor: string;
        secondaryColor: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
