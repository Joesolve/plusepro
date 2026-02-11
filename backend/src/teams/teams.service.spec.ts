import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TeamsService', () => {
  let service: TeamsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    team: {
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
        TeamsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a team with required fields', async () => {
      const createData = { name: 'Frontend', departmentId: 'dept-1' };
      const expected = { id: 'team-1', tenantId: 'tenant-1', ...createData, managerId: null };
      mockPrismaService.team.create.mockResolvedValue(expected);

      const result = await service.create('tenant-1', createData);

      expect(result).toEqual(expected);
      expect(mockPrismaService.team.create).toHaveBeenCalledWith({
        data: { tenantId: 'tenant-1', name: 'Frontend', departmentId: 'dept-1' },
      });
    });

    it('should create a team with optional managerId', async () => {
      const createData = { name: 'Backend', departmentId: 'dept-1', managerId: 'user-1' };
      const expected = { id: 'team-2', tenantId: 'tenant-1', ...createData };
      mockPrismaService.team.create.mockResolvedValue(expected);

      const result = await service.create('tenant-1', createData);

      expect(result).toEqual(expected);
      expect(mockPrismaService.team.create).toHaveBeenCalledWith({
        data: { tenantId: 'tenant-1', name: 'Backend', departmentId: 'dept-1', managerId: 'user-1' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all teams for a tenant with related data', async () => {
      const teams = [
        {
          id: 'team-1',
          tenantId: 'tenant-1',
          name: 'Frontend',
          department: { id: 'dept-1', name: 'Engineering' },
          manager: { id: 'user-1', firstName: 'Alice', lastName: 'Smith' },
          _count: { members: 5 },
        },
        {
          id: 'team-2',
          tenantId: 'tenant-1',
          name: 'Backend',
          department: { id: 'dept-1', name: 'Engineering' },
          manager: null,
          _count: { members: 3 },
        },
      ];
      mockPrismaService.team.findMany.mockResolvedValue(teams);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual(teams);
      expect(mockPrismaService.team.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        include: {
          department: { select: { id: true, name: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { members: true } },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no teams exist', async () => {
      mockPrismaService.team.findMany.mockResolvedValue([]);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single team with full details', async () => {
      const team = {
        id: 'team-1',
        tenantId: 'tenant-1',
        name: 'Frontend',
        department: { id: 'dept-1', name: 'Engineering' },
        manager: { id: 'user-1', firstName: 'Alice', lastName: 'Smith', email: 'alice@test.com' },
        members: [
          { id: 'user-2', firstName: 'Bob', lastName: 'Jones', email: 'bob@test.com', role: 'EMPLOYEE' },
        ],
      };
      mockPrismaService.team.findFirst.mockResolvedValue(team);

      const result = await service.findOne('team-1', 'tenant-1');

      expect(result).toEqual(team);
      expect(mockPrismaService.team.findFirst).toHaveBeenCalledWith({
        where: { id: 'team-1', tenantId: 'tenant-1' },
        include: {
          department: true,
          manager: { select: { id: true, firstName: true, lastName: true, email: true } },
          members: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        },
      });
    });

    it('should throw NotFoundException when team does not exist', async () => {
      mockPrismaService.team.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update team name', async () => {
      const existing = {
        id: 'team-1',
        tenantId: 'tenant-1',
        name: 'Frontend',
        department: { id: 'dept-1', name: 'Engineering' },
        manager: null,
        members: [],
      };
      const updated = { ...existing, name: 'Frontend Engineering' };
      mockPrismaService.team.findFirst.mockResolvedValue(existing);
      mockPrismaService.team.update.mockResolvedValue(updated);

      const result = await service.update('team-1', 'tenant-1', { name: 'Frontend Engineering' });

      expect(result).toEqual(updated);
      expect(mockPrismaService.team.update).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        data: { name: 'Frontend Engineering' },
      });
    });

    it('should update team managerId', async () => {
      const existing = {
        id: 'team-1',
        tenantId: 'tenant-1',
        name: 'Frontend',
        department: { id: 'dept-1', name: 'Engineering' },
        manager: null,
        members: [],
      };
      const updated = { ...existing, managerId: 'user-3' };
      mockPrismaService.team.findFirst.mockResolvedValue(existing);
      mockPrismaService.team.update.mockResolvedValue(updated);

      const result = await service.update('team-1', 'tenant-1', { managerId: 'user-3' });

      expect(result).toEqual(updated);
      expect(mockPrismaService.team.update).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        data: { managerId: 'user-3' },
      });
    });

    it('should throw NotFoundException when updating non-existent team', async () => {
      mockPrismaService.team.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', 'tenant-1', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a team', async () => {
      const existing = {
        id: 'team-1',
        tenantId: 'tenant-1',
        name: 'Frontend',
        department: { id: 'dept-1', name: 'Engineering' },
        manager: null,
        members: [],
      };
      mockPrismaService.team.findFirst.mockResolvedValue(existing);
      mockPrismaService.team.delete.mockResolvedValue(existing);

      const result = await service.remove('team-1', 'tenant-1');

      expect(result).toEqual(existing);
      expect(mockPrismaService.team.delete).toHaveBeenCalledWith({
        where: { id: 'team-1' },
      });
    });

    it('should throw NotFoundException when deleting non-existent team', async () => {
      mockPrismaService.team.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
