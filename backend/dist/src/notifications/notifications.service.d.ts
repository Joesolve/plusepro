import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
export declare class NotificationsService {
    private prisma;
    private config;
    constructor(prisma: PrismaService, config: ConfigService);
    create(data: {
        tenantId: string;
        userId: string;
        type: NotificationType;
        title: string;
        body: string;
        link?: string;
        sendEmail?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        link: string | null;
        title: string;
        body: string;
        isRead: boolean;
        emailSent: boolean;
    }>;
    getUnreadCount(userId: string): Promise<number>;
    findAll(userId: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        link: string | null;
        title: string;
        body: string;
        isRead: boolean;
        emailSent: boolean;
    }[]>;
    markAsRead(id: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    private sendEmail;
}
