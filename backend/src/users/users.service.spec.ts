import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  team: {
    findMany: jest.fn(),
  },
  eraseUserData: jest.fn(),
  $transaction: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = mockPrismaService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────────
  // findAll()
  // ──────────────────────────────────────────────────
  describe('findAll', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const pagination = { page: 1, limit: 20 };

    it('should return paginated users for COMPANY_ADMIN (all tenant users)', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'a@example.com',
          firstName: 'Alice',
          lastName: 'Admin',
          avatarUrl: null,
          role: 'COMPANY_ADMIN',
          isActive: true,
          department: null,
          team: null,
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'user-2',
          email: 'b@example.com',
          firstName: 'Bob',
          lastName: 'Bee',
          avatarUrl: null,
          role: 'EMPLOYEE',
          isActive: true,
          department: { id: 'dept-1', name: 'Engineering' },
          team: { id: 'team-1', name: 'Alpha' },
          createdAt: new Date('2025-01-02'),
        },
      ];

      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(2);

      const result = await service.findAll(
        tenantId,
        'COMPANY_ADMIN' as any,
        userId,
        pagination,
      );

      // Should NOT query for managed teams (admin sees all)
      expect(prisma.team.findMany).not.toHaveBeenCalled();

      // Should query users scoped to tenant and not deleted
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, deletedAt: null },
          skip: 0,
          take: 20,
        }),
      );

      expect(result).toEqual({
        data: mockUsers,
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
    });

    it('should scope MANAGER queries to their managed teams only', async () => {
      prisma.team.findMany.mockResolvedValue([
        { id: 'team-1' },
        { id: 'team-2' },
      ]);
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll(tenantId, 'MANAGER' as any, userId, pagination);

      // Should fetch the teams managed by this user
      expect(prisma.team.findMany).toHaveBeenCalledWith({
        where: { managerId: userId },
        select: { id: true },
      });

      // The where clause should include teamId filter
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId,
            deletedAt: null,
            teamId: { in: ['team-1', 'team-2'] },
          },
        }),
      );
    });

    it('should calculate skip correctly for page 3', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll(tenantId, 'COMPANY_ADMIN' as any, userId, {
        page: 3,
        limit: 10,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3 - 1) * 10
          take: 10,
        }),
      );
    });

    it('should use default page=1 and limit=20 when not provided', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll(tenantId, 'COMPANY_ADMIN' as any, userId, {});

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────
  // findOne()
  // ──────────────────────────────────────────────────
  describe('findOne', () => {
    const tenantId = 'tenant-1';

    it('should return a user when found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'a@example.com',
        firstName: 'Alice',
        lastName: 'Admin',
        tenantId,
        deletedAt: null,
        department: { id: 'dept-1', name: 'Engineering' },
        team: { id: 'team-1', name: 'Alpha' },
      };
      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findOne('user-1', tenantId);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-1', tenantId, deletedAt: null },
        include: { department: true, team: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent', tenantId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne('nonexistent', tenantId),
      ).rejects.toThrow('User not found');
    });

    it('should not find users from a different tenant', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('user-1', 'different-tenant'),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-1', tenantId: 'different-tenant', deletedAt: null },
        include: { department: true, team: true },
      });
    });
  });

  // ──────────────────────────────────────────────────
  // update()
  // ──────────────────────────────────────────────────
  describe('update', () => {
    const tenantId = 'tenant-1';

    it('should update a user when found', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'a@example.com',
        firstName: 'Alice',
        tenantId,
        deletedAt: null,
        department: null,
        team: null,
      };
      prisma.user.findFirst.mockResolvedValue(existingUser);

      const updatedUser = { ...existingUser, firstName: 'Alicia' };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', tenantId, {
        firstName: 'Alicia',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { firstName: 'Alicia' },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when updating a nonexistent user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', tenantId, { firstName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────
  // softDelete()
  // ──────────────────────────────────────────────────
  describe('softDelete', () => {
    const tenantId = 'tenant-1';

    it('should soft-delete a user by setting deletedAt and isActive=false', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'a@example.com',
        tenantId,
        deletedAt: null,
        isActive: true,
        department: null,
        team: null,
      };
      prisma.user.findFirst.mockResolvedValue(existingUser);

      const deletedUser = {
        ...existingUser,
        deletedAt: new Date(),
        isActive: false,
      };
      prisma.user.update.mockResolvedValue(deletedUser);

      const result = await service.softDelete('user-1', tenantId);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-1', tenantId, deletedAt: null },
        include: { department: true, team: true },
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { deletedAt: expect.any(Date), isActive: false },
      });

      expect(result.deletedAt).toBeDefined();
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when soft-deleting a nonexistent user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.softDelete('nonexistent', tenantId),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────
  // eraseUserData()
  // ──────────────────────────────────────────────────
  describe('eraseUserData', () => {
    const tenantId = 'tenant-1';

    it('should call prisma.eraseUserData when user exists', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        tenantId,
      });
      prisma.eraseUserData.mockResolvedValue(undefined);

      await service.eraseUserData('user-1', tenantId);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-1', tenantId },
      });
      expect(prisma.eraseUserData).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.eraseUserData('nonexistent', tenantId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.eraseUserData('nonexistent', tenantId),
      ).rejects.toThrow('User not found');

      expect(prisma.eraseUserData).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────
  // bulkCreate()
  // ──────────────────────────────────────────────────
  describe('bulkCreate', () => {
    it('should create users in a transaction with tenant scoping', async () => {
      const users = [
        { email: 'a@example.com', firstName: 'A', lastName: 'User' },
        {
          email: 'b@example.com',
          firstName: 'B',
          lastName: 'User',
          role: 'MANAGER' as any,
        },
      ];
      const tenantId = 'tenant-1';

      // $transaction receives an array of Prisma operations (PrismaPromise[])
      // The service calls prisma.$transaction(users.map(...)) which maps each
      // user to a prisma.user.create call. We mock $transaction to return results.
      const createdUsers = [
        { id: '1', ...users[0], tenantId, role: 'EMPLOYEE' },
        { id: '2', ...users[1], tenantId, role: 'MANAGER' },
      ];
      prisma.$transaction.mockResolvedValue(createdUsers);

      const result = await service.bulkCreate(tenantId, users);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(createdUsers);
    });
  });
});
