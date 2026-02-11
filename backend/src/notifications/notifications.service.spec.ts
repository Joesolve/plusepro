import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let config: ConfigService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    config = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createData = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      type: 'SURVEY_ASSIGNED' as any,
      title: 'New Survey',
      body: 'You have a new survey to complete',
      link: '/surveys/123',
    };

    it('should create a notification without sending email', async () => {
      const expected = { id: 'notif-1', ...createData, isRead: false };
      mockPrismaService.notification.create.mockResolvedValue(expected);

      const result = await service.create(createData);

      expect(result).toEqual(expected);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          tenantId: createData.tenantId,
          userId: createData.userId,
          type: createData.type,
          title: createData.title,
          body: createData.body,
          link: createData.link,
        },
      });
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should create a notification and attempt email when sendEmail is true', async () => {
      const expected = { id: 'notif-1', ...createData, isRead: false };
      mockPrismaService.notification.create.mockResolvedValue(expected);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue(undefined);

      const result = await service.create({ ...createData, sendEmail: true });

      expect(result).toEqual(expected);
      expect(mockPrismaService.notification.create).toHaveBeenCalled();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: createData.userId },
        select: { email: true, firstName: true },
      });
    });

    it('should skip email if user is not found', async () => {
      const expected = { id: 'notif-1', ...createData, isRead: false };
      mockPrismaService.notification.create.mockResolvedValue(expected);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.create({ ...createData, sendEmail: true });

      expect(result).toEqual(expected);
    });

    it('should skip email if API key starts with SG.your', async () => {
      const expected = { id: 'notif-1', ...createData, isRead: false };
      mockPrismaService.notification.create.mockResolvedValue(expected);
      mockPrismaService.user.findUnique.mockResolvedValue({
        email: 'test@example.com',
        firstName: 'Test',
      });
      mockConfigService.get.mockReturnValue('SG.your-fake-key');

      const result = await service.create({ ...createData, sendEmail: true });

      expect(result).toEqual(expected);
    });

    it('should create notification with optional link as undefined', async () => {
      const dataWithoutLink = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        type: 'RECOGNITION_RECEIVED' as any,
        title: 'Recognition',
        body: 'You received a recognition',
      };
      const expected = { id: 'notif-2', ...dataWithoutLink, isRead: false, link: undefined };
      mockPrismaService.notification.create.mockResolvedValue(expected);

      const result = await service.create(dataWithoutLink);

      expect(result).toEqual(expected);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          tenantId: dataWithoutLink.tenantId,
          userId: dataWithoutLink.userId,
          type: dataWithoutLink.type,
          title: dataWithoutLink.title,
          body: dataWithoutLink.body,
          link: undefined,
        },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count for a user', async () => {
      mockPrismaService.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
    });

    it('should return 0 when there are no unread notifications', async () => {
      mockPrismaService.notification.count.mockResolvedValue(0);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return notifications for a user with default limit', async () => {
      const notifications = [
        { id: 'n1', title: 'First', createdAt: new Date() },
        { id: 'n2', title: 'Second', createdAt: new Date() },
      ];
      mockPrismaService.notification.findMany.mockResolvedValue(notifications);

      const result = await service.findAll('user-1');

      expect(result).toEqual(notifications);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return notifications with a custom limit', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      await service.findAll('user-1', 5);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark a specific notification as read', async () => {
      const updateResult = { count: 1 };
      mockPrismaService.notification.updateMany.mockResolvedValue(updateResult);

      const result = await service.markAsRead('notif-1', 'user-1');

      expect(result).toEqual(updateResult);
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
        data: { isRead: true },
      });
    });

    it('should return count 0 if notification does not belong to user', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markAsRead('notif-1', 'wrong-user');

      expect(result).toEqual({ count: 0 });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for a user', async () => {
      const updateResult = { count: 3 };
      mockPrismaService.notification.updateMany.mockResolvedValue(updateResult);

      const result = await service.markAllAsRead('user-1');

      expect(result).toEqual(updateResult);
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
    });

    it('should return count 0 when no unread notifications exist', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markAllAsRead('user-1');

      expect(result).toEqual({ count: 0 });
    });
  });
});
