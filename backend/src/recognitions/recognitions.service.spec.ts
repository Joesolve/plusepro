import { Test, TestingModule } from '@nestjs/testing';
import { RecognitionsService } from './recognitions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RecognitionsService', () => {
  let service: RecognitionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    recognition: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    coreValue: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecognitionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RecognitionsService>(RecognitionsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a recognition with included relations', async () => {
      const createData = {
        receiverId: 'user-2',
        coreValueId: 'cv-1',
        message: 'Great job on the project!',
      };
      const expected = {
        id: 'rec-1',
        tenantId: 'tenant-1',
        senderId: 'user-1',
        ...createData,
        sender: { id: 'user-1', firstName: 'Alice', lastName: 'Smith', avatarUrl: null },
        receiver: { id: 'user-2', firstName: 'Bob', lastName: 'Jones', avatarUrl: null },
        coreValue: { id: 'cv-1', name: 'Teamwork' },
      };
      mockPrismaService.recognition.create.mockResolvedValue(expected);

      const result = await service.create('tenant-1', 'user-1', createData);

      expect(result).toEqual(expected);
      expect(mockPrismaService.recognition.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          senderId: 'user-1',
          receiverId: 'user-2',
          coreValueId: 'cv-1',
          message: 'Great job on the project!',
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          receiver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          coreValue: { select: { id: true, name: true } },
        },
      });
    });
  });

  describe('getFeed', () => {
    it('should return paginated public recognitions feed with default page and limit', async () => {
      const recognitions = [
        {
          id: 'rec-1',
          sender: { id: 'u1', firstName: 'Alice', lastName: 'Smith', avatarUrl: null },
          receiver: { id: 'u2', firstName: 'Bob', lastName: 'Jones', avatarUrl: null },
          coreValue: { id: 'cv-1', name: 'Teamwork' },
        },
      ];
      mockPrismaService.recognition.findMany.mockResolvedValue(recognitions);
      mockPrismaService.recognition.count.mockResolvedValue(1);

      const result = await service.getFeed('tenant-1');

      expect(result).toEqual({
        data: recognitions,
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });
      expect(mockPrismaService.recognition.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', isPublic: true },
        skip: 0,
        take: 20,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          receiver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          coreValue: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return paginated feed with custom page and limit', async () => {
      mockPrismaService.recognition.findMany.mockResolvedValue([]);
      mockPrismaService.recognition.count.mockResolvedValue(50);

      const result = await service.getFeed('tenant-1', 3, 10);

      expect(result.meta).toEqual({
        total: 50,
        page: 3,
        limit: 10,
        totalPages: 5,
      });
      expect(mockPrismaService.recognition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it('should only fetch public recognitions', async () => {
      mockPrismaService.recognition.findMany.mockResolvedValue([]);
      mockPrismaService.recognition.count.mockResolvedValue(0);

      await service.getFeed('tenant-1');

      expect(mockPrismaService.recognition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-1', isPublic: true },
        }),
      );
      expect(mockPrismaService.recognition.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', isPublic: true },
      });
    });
  });

  describe('getUserStats', () => {
    it('should return recognition stats per core value for a user', async () => {
      mockPrismaService.recognition.groupBy.mockResolvedValue([
        { coreValueId: 'cv-1', _count: { id: 5 } },
        { coreValueId: 'cv-2', _count: { id: 3 } },
      ]);
      mockPrismaService.coreValue.findMany.mockResolvedValue([
        { id: 'cv-1', name: 'Teamwork', tenantId: 'tenant-1' },
        { id: 'cv-2', name: 'Innovation', tenantId: 'tenant-1' },
      ]);

      const result = await service.getUserStats('tenant-1', 'user-1');

      expect(result).toEqual([
        { coreValueId: 'cv-1', coreValueName: 'Teamwork', count: 5 },
        { coreValueId: 'cv-2', coreValueName: 'Innovation', count: 3 },
      ]);
      expect(mockPrismaService.recognition.groupBy).toHaveBeenCalledWith({
        by: ['coreValueId'],
        where: { tenantId: 'tenant-1', receiverId: 'user-1' },
        _count: { id: true },
      });
      expect(mockPrismaService.coreValue.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
      });
    });

    it('should return "Unknown" for unmatched core value IDs', async () => {
      mockPrismaService.recognition.groupBy.mockResolvedValue([
        { coreValueId: 'cv-deleted', _count: { id: 2 } },
      ]);
      mockPrismaService.coreValue.findMany.mockResolvedValue([]);

      const result = await service.getUserStats('tenant-1', 'user-1');

      expect(result).toEqual([
        { coreValueId: 'cv-deleted', coreValueName: 'Unknown', count: 2 },
      ]);
    });

    it('should return empty array when user has no recognitions', async () => {
      mockPrismaService.recognition.groupBy.mockResolvedValue([]);
      mockPrismaService.coreValue.findMany.mockResolvedValue([
        { id: 'cv-1', name: 'Teamwork', tenantId: 'tenant-1' },
      ]);

      const result = await service.getUserStats('tenant-1', 'user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getActivityByCoreValue', () => {
    it('should return recognition counts grouped by core value for a tenant', async () => {
      mockPrismaService.recognition.groupBy.mockResolvedValue([
        { coreValueId: 'cv-1', _count: { id: 10 } },
        { coreValueId: 'cv-2', _count: { id: 7 } },
      ]);
      mockPrismaService.coreValue.findMany.mockResolvedValue([
        { id: 'cv-1', name: 'Integrity', tenantId: 'tenant-1' },
        { id: 'cv-2', name: 'Excellence', tenantId: 'tenant-1' },
      ]);

      const result = await service.getActivityByCoreValue('tenant-1');

      expect(result).toEqual([
        { coreValueId: 'cv-1', coreValueName: 'Integrity', count: 10 },
        { coreValueId: 'cv-2', coreValueName: 'Excellence', count: 7 },
      ]);
      expect(mockPrismaService.recognition.groupBy).toHaveBeenCalledWith({
        by: ['coreValueId'],
        where: { tenantId: 'tenant-1' },
        _count: { id: true },
      });
    });

    it('should return "Unknown" for deleted core values', async () => {
      mockPrismaService.recognition.groupBy.mockResolvedValue([
        { coreValueId: 'cv-gone', _count: { id: 4 } },
      ]);
      mockPrismaService.coreValue.findMany.mockResolvedValue([]);

      const result = await service.getActivityByCoreValue('tenant-1');

      expect(result).toEqual([
        { coreValueId: 'cv-gone', coreValueName: 'Unknown', count: 4 },
      ]);
    });
  });
});
