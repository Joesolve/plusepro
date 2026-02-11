import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private service;
    constructor(service: NotificationsService);
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
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(id: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
