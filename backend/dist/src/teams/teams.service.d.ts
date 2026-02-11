import { PrismaService } from '../prisma/prisma.service';
export declare class TeamsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, data: {
        name: string;
        departmentId: string;
        managerId?: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        departmentId: string;
        managerId: string | null;
    }>;
    findAll(tenantId: string): Promise<({
        department: {
            id: string;
            name: string;
        };
        _count: {
            members: number;
        };
        manager: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        departmentId: string;
        managerId: string | null;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        department: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
        };
        manager: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
        members: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.Role;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        departmentId: string;
        managerId: string | null;
    }>;
    update(id: string, tenantId: string, data: {
        name?: string;
        managerId?: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        departmentId: string;
        managerId: string | null;
    }>;
    remove(id: string, tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        departmentId: string;
        managerId: string | null;
    }>;
}
