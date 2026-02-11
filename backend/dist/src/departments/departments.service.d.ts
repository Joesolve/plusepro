import { PrismaService } from '../prisma/prisma.service';
export declare class DepartmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, name: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }>;
    findAll(tenantId: string): Promise<({
        teams: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            departmentId: string;
            managerId: string | null;
        }[];
        _count: {
            users: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        users: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string | null;
            email: string;
            passwordHash: string | null;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
            role: import(".prisma/client").$Enums.Role;
            isActive: boolean;
            emailVerified: Date | null;
            lastLoginAt: Date | null;
            deletedAt: Date | null;
            departmentId: string | null;
            teamId: string | null;
        }[];
        teams: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            departmentId: string;
            managerId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }>;
    update(id: string, tenantId: string, name: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }>;
    remove(id: string, tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }>;
}
