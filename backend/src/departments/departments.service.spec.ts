import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    department: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a department with tenantId and name', async () => {
      const expected = { id: 'dept-1', tenantId: 'tenant-1', name: 'Engineering' };
      mockPrismaService.department.create.mockResolvedValue(expected);

      const result = await service.create('tenant-1', 'Engineering');

      expect(result).toEqual(expected);
      expect(mockPrismaService.department.create).toHaveBeenCalledWith({
        data: { tenantId: 'tenant-1', name: 'Engineering' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all departments for a tenant with teams and user count', async () => {
      const departments = [
        {
          id: 'dept-1',
          tenantId: 'tenant-1',
          name: 'Engineering',
          teams: [{ id: 'team-1', name: 'Frontend' }],
          _count: { users: 10 },
        },
        {
          id: 'dept-2',
          tenantId: 'tenant-1',
          name: 'Marketing',
          teams: [],
          _count: { users: 5 },
        },
      ];
      mockPrismaService.department.findMany.mockResolvedValue(departments);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual(departments);
      expect(mockPrismaService.department.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        include: { teams: true, _count: { select: { users: true } } },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no departments exist', async () => {
      mockPrismaService.department.findMany.mockResolvedValue([]);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single department with teams and users', async () => {
      const department = {
        id: 'dept-1',
        tenantId: 'tenant-1',
        name: 'Engineering',
        teams: [{ id: 'team-1', name: 'Frontend' }],
        users: [{ id: 'user-1', firstName: 'John', lastName: 'Doe' }],
      };
      mockPrismaService.department.findFirst.mockResolvedValue(department);

      const result = await service.findOne('dept-1', 'tenant-1');

      expect(result).toEqual(department);
      expect(mockPrismaService.department.findFirst).toHaveBeenCalledWith({
        where: { id: 'dept-1', tenantId: 'tenant-1' },
        include: { teams: true, users: true },
      });
    });

    it('should throw NotFoundException when department does not exist', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update department name', async () => {
      const existing = { id: 'dept-1', tenantId: 'tenant-1', name: 'Engineering', teams: [], users: [] };
      const updated = { ...existing, name: 'Product Engineering' };
      mockPrismaService.department.findFirst.mockResolvedValue(existing);
      mockPrismaService.department.update.mockResolvedValue(updated);

      const result = await service.update('dept-1', 'tenant-1', 'Product Engineering');

      expect(result).toEqual(updated);
      expect(mockPrismaService.department.update).toHaveBeenCalledWith({
        where: { id: 'dept-1' },
        data: { name: 'Product Engineering' },
      });
    });

    it('should throw NotFoundException when updating non-existent department', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', 'tenant-1', 'New Name'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a department', async () => {
      const existing = { id: 'dept-1', tenantId: 'tenant-1', name: 'Engineering', teams: [], users: [] };
      mockPrismaService.department.findFirst.mockResolvedValue(existing);
      mockPrismaService.department.delete.mockResolvedValue(existing);

      const result = await service.remove('dept-1', 'tenant-1');

      expect(result).toEqual(existing);
      expect(mockPrismaService.department.delete).toHaveBeenCalledWith({
        where: { id: 'dept-1' },
      });
    });

    it('should throw NotFoundException when deleting non-existent department', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
