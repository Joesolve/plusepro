import { PrismaService } from '../prisma/prisma.service';
export declare class RecognitionsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, senderId: string, data: {
        receiverId: string;
        coreValueId: string;
        message: string;
    }): Promise<{
        coreValue: {
            id: string;
            name: string;
        };
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
        receiver: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        tenantId: string;
        receiverId: string;
        senderId: string;
        message: string;
        coreValueId: string;
        isPublic: boolean;
    }>;
    getFeed(tenantId: string, page?: number, limit?: number): Promise<{
        data: ({
            coreValue: {
                id: string;
                name: string;
            };
            sender: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
            receiver: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            tenantId: string;
            receiverId: string;
            senderId: string;
            message: string;
            coreValueId: string;
            isPublic: boolean;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUserStats(tenantId: string, userId: string): Promise<{
        coreValueId: string;
        coreValueName: string;
        count: number;
    }[]>;
    getActivityByCoreValue(tenantId: string): Promise<{
        coreValueId: string;
        coreValueName: string;
        count: number;
    }[]>;
}
