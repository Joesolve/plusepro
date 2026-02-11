import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
}));

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: PrismaService;

  const mockPrismaService = {
    coreValue: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    department: {
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    survey: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOnboardingStatus', () => {
    it('should return all steps incomplete when nothing is set up', async () => {
      mockPrismaService.coreValue.count.mockResolvedValue(0);
      mockPrismaService.user.count.mockResolvedValue(1); // only the admin user
      mockPrismaService.survey.count.mockResolvedValue(0);
      mockPrismaService.department.count.mockResolvedValue(0);

      const result = await service.getOnboardingStatus('tenant-1');

      expect(result.steps).toHaveLength(4);
      expect(result.steps[0]).toEqual({
        key: 'core_values',
        label: 'Define Core Values',
        completed: false,
      });
      expect(result.steps[1]).toEqual({
        key: 'employees',
        label: 'Add Employees',
        completed: false,
      });
      expect(result.steps[2]).toEqual({
        key: 'departments',
        label: 'Set Up Departments',
        completed: false,
      });
      expect(result.steps[3]).toEqual({
        key: 'first_survey',
        label: 'Create First Survey',
        completed: false,
      });
      expect(result.completedCount).toBe(0);
      expect(result.totalSteps).toBe(4);
      expect(result.isComplete).toBe(false);
    });

    it('should return all steps complete when everything is set up', async () => {
      mockPrismaService.coreValue.count.mockResolvedValue(3);
      mockPrismaService.user.count.mockResolvedValue(5);
      mockPrismaService.survey.count.mockResolvedValue(1);
      mockPrismaService.department.count.mockResolvedValue(2);

      const result = await service.getOnboardingStatus('tenant-1');

      expect(result.steps.every((s: { completed: boolean }) => s.completed)).toBe(true);
      expect(result.completedCount).toBe(4);
      expect(result.totalSteps).toBe(4);
      expect(result.isComplete).toBe(true);
    });

    it('should mark employees step as incomplete when only 1 user exists', async () => {
      mockPrismaService.coreValue.count.mockResolvedValue(1);
      mockPrismaService.user.count.mockResolvedValue(1);
      mockPrismaService.survey.count.mockResolvedValue(0);
      mockPrismaService.department.count.mockResolvedValue(0);

      const result = await service.getOnboardingStatus('tenant-1');

      const employeesStep = result.steps.find((s: { key: string }) => s.key === 'employees');
      expect(employeesStep!.completed).toBe(false);
    });

    it('should mark employees step as complete when more than 1 user exists', async () => {
      mockPrismaService.coreValue.count.mockResolvedValue(0);
      mockPrismaService.user.count.mockResolvedValue(2);
      mockPrismaService.survey.count.mockResolvedValue(0);
      mockPrismaService.department.count.mockResolvedValue(0);

      const result = await service.getOnboardingStatus('tenant-1');

      const employeesStep = result.steps.find((s: { key: string }) => s.key === 'employees');
      expect(employeesStep!.completed).toBe(true);
    });

    it('should return partial completion correctly', async () => {
      mockPrismaService.coreValue.count.mockResolvedValue(2);
      mockPrismaService.user.count.mockResolvedValue(3);
      mockPrismaService.survey.count.mockResolvedValue(0);
      mockPrismaService.department.count.mockResolvedValue(0);

      const result = await service.getOnboardingStatus('tenant-1');

      expect(result.completedCount).toBe(2);
      expect(result.isComplete).toBe(false);
    });

    it('should query prisma with correct tenant scoping', async () => {
      mockPrismaService.coreValue.count.mockResolvedValue(0);
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.survey.count.mockResolvedValue(0);
      mockPrismaService.department.count.mockResolvedValue(0);

      await service.getOnboardingStatus('tenant-abc');

      expect(mockPrismaService.coreValue.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-abc' },
      });
      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-abc' },
      });
      expect(mockPrismaService.survey.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-abc' },
      });
      expect(mockPrismaService.department.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-abc' },
      });
    });
  });

  describe('setCoreValues', () => {
    it('should throw BadRequestException when empty values array is provided', async () => {
      await expect(service.setCoreValues('tenant-1', [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create new core values that do not already exist', async () => {
      mockPrismaService.coreValue.findMany
        .mockResolvedValueOnce([]) // existing values - none
        .mockResolvedValueOnce([ // returned after creation
          { id: 'cv-1', tenantId: 'tenant-1', name: 'Teamwork', description: '' },
          { id: 'cv-2', tenantId: 'tenant-1', name: 'Innovation', description: 'Think creatively' },
        ]);
      mockPrismaService.coreValue.createMany.mockResolvedValue({ count: 2 });

      const result = await service.setCoreValues('tenant-1', [
        { name: 'Teamwork' },
        { name: 'Innovation', description: 'Think creatively' },
      ]);

      expect(mockPrismaService.coreValue.createMany).toHaveBeenCalledWith({
        data: [
          { tenantId: 'tenant-1', name: 'Teamwork', description: '' },
          { tenantId: 'tenant-1', name: 'Innovation', description: 'Think creatively' },
        ],
      });
      expect(result).toHaveLength(2);
    });

    it('should skip creating values that already exist (case-insensitive)', async () => {
      mockPrismaService.coreValue.findMany
        .mockResolvedValueOnce([
          { id: 'cv-1', tenantId: 'tenant-1', name: 'Teamwork' },
        ])
        .mockResolvedValueOnce([
          { id: 'cv-1', tenantId: 'tenant-1', name: 'Teamwork', description: '' },
          { id: 'cv-2', tenantId: 'tenant-1', name: 'Innovation', description: '' },
        ]);
      mockPrismaService.coreValue.createMany.mockResolvedValue({ count: 1 });

      await service.setCoreValues('tenant-1', [
        { name: 'teamwork' }, // existing (case-insensitive match)
        { name: 'Innovation' }, // new
      ]);

      expect(mockPrismaService.coreValue.createMany).toHaveBeenCalledWith({
        data: [
          { tenantId: 'tenant-1', name: 'Innovation', description: '' },
        ],
      });
    });

    it('should not call createMany when all values already exist', async () => {
      mockPrismaService.coreValue.findMany
        .mockResolvedValueOnce([
          { id: 'cv-1', tenantId: 'tenant-1', name: 'Teamwork' },
        ])
        .mockResolvedValueOnce([
          { id: 'cv-1', tenantId: 'tenant-1', name: 'Teamwork', description: '' },
        ]);

      await service.setCoreValues('tenant-1', [{ name: 'Teamwork' }]);

      expect(mockPrismaService.coreValue.createMany).not.toHaveBeenCalled();
    });

    it('should return all core values ordered by name after creation', async () => {
      mockPrismaService.coreValue.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 'cv-1', tenantId: 'tenant-1', name: 'Accountability', description: '' },
          { id: 'cv-2', tenantId: 'tenant-1', name: 'Transparency', description: '' },
        ]);
      mockPrismaService.coreValue.createMany.mockResolvedValue({ count: 2 });

      await service.setCoreValues('tenant-1', [
        { name: 'Transparency' },
        { name: 'Accountability' },
      ]);

      // Verify the final findMany call uses orderBy name asc
      const lastCall = mockPrismaService.coreValue.findMany.mock.calls[1];
      expect(lastCall[0]).toEqual({
        where: { tenantId: 'tenant-1' },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('uploadEmployees', () => {
    it('should throw BadRequestException when empty employees array is provided', async () => {
      await expect(service.uploadEmployees('tenant-1', [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create new employees and skip existing ones', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ id: 'existing', email: 'existing@test.com' }) // first: existing
        .mockResolvedValueOnce(null); // second: new
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-user',
        email: 'new@test.com',
      });

      const result = await service.uploadEmployees('tenant-1', [
        { email: 'existing@test.com', firstName: 'Existing', lastName: 'User' },
        { email: 'new@test.com', firstName: 'New', lastName: 'User' },
      ]);

      expect(result.created).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should create department if departmentName is provided and does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.department.findFirst.mockResolvedValue(null);
      mockPrismaService.department.create.mockResolvedValue({
        id: 'dept-1',
        name: 'Engineering',
      });
      mockPrismaService.user.create.mockResolvedValue({ id: 'user-1' });

      const result = await service.uploadEmployees('tenant-1', [
        { email: 'dev@test.com', firstName: 'Dev', lastName: 'User', departmentName: 'Engineering' },
      ]);

      expect(mockPrismaService.department.create).toHaveBeenCalledWith({
        data: { tenantId: 'tenant-1', name: 'Engineering' },
      });
      expect(result.created).toBe(1);
    });

    it('should reuse existing department if departmentName already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.department.findFirst.mockResolvedValue({
        id: 'dept-existing',
        name: 'Engineering',
      });
      mockPrismaService.user.create.mockResolvedValue({ id: 'user-1' });

      await service.uploadEmployees('tenant-1', [
        { email: 'dev@test.com', firstName: 'Dev', lastName: 'User', departmentName: 'Engineering' },
      ]);

      expect(mockPrismaService.department.create).not.toHaveBeenCalled();
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          departmentId: 'dept-existing',
        }),
      });
    });

    it('should record errors for failed employee creation', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockRejectedValue(new Error('DB constraint violated'));

      const result = await service.uploadEmployees('tenant-1', [
        { email: 'fail@test.com', firstName: 'Fail', lastName: 'User' },
      ]);

      expect(result.created).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('fail@test.com');
      expect(result.errors[0]).toContain('DB constraint violated');
    });
  });
});
