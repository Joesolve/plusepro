import { Test, TestingModule } from '@nestjs/testing';
import { SelfAssessmentsService } from './self-assessments.service';
import { PrismaService } from '../prisma/prisma.service';

// Mirror the Prisma AssessmentType enum without importing from @prisma/client
const AssessmentType = {
  SELF: 'SELF',
  MANAGER: 'MANAGER',
} as const;

describe('SelfAssessmentsService', () => {
  let service: SelfAssessmentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    assessmentCycle: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    selfAssessment: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const tenantId = 'tenant-001';
  const cycleId = 'cycle-001';
  const employeeId = 'emp-001';
  const assessorId = 'mgr-001';
  const coreValueId = 'cv-001';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SelfAssessmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SelfAssessmentsService>(SelfAssessmentsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -------------------------------------------------------
  // createCycle()
  // -------------------------------------------------------
  describe('createCycle', () => {
    it('should create an assessment cycle', async () => {
      const data = {
        name: 'Q1 2026 Review',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-31'),
      };

      const expectedResult = {
        id: cycleId,
        tenantId,
        ...data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.assessmentCycle.create.mockResolvedValue(expectedResult);

      const result = await service.createCycle(tenantId, data);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.assessmentCycle.create).toHaveBeenCalledWith({
        data: { tenantId, ...data },
      });
    });
  });

  // -------------------------------------------------------
  // getActiveCycles()
  // -------------------------------------------------------
  describe('getActiveCycles', () => {
    it('should return only active cycles ordered by startDate desc', async () => {
      const cycles = [
        { id: 'cycle-2', tenantId, name: 'Q2', isActive: true, startDate: new Date('2026-04-01') },
        { id: 'cycle-1', tenantId, name: 'Q1', isActive: true, startDate: new Date('2026-01-01') },
      ];

      mockPrismaService.assessmentCycle.findMany.mockResolvedValue(cycles);

      const result = await service.getActiveCycles(tenantId);

      expect(result).toEqual(cycles);
      expect(mockPrismaService.assessmentCycle.findMany).toHaveBeenCalledWith({
        where: { tenantId, isActive: true },
        orderBy: { startDate: 'desc' },
      });
    });

    it('should return an empty array when no active cycles exist', async () => {
      mockPrismaService.assessmentCycle.findMany.mockResolvedValue([]);

      const result = await service.getActiveCycles(tenantId);

      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------
  // submitAssessment() (upsert)
  // -------------------------------------------------------
  describe('submitAssessment', () => {
    it('should upsert a self-assessment with the correct compound key', async () => {
      const data = {
        cycleId,
        employeeId,
        assessorId,
        coreValueId,
        rating: 8,
        comment: 'Great progress this quarter',
        assessmentType: AssessmentType.SELF as any,
      };

      const expectedResult = {
        id: 'sa-001',
        tenantId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.selfAssessment.upsert.mockResolvedValue(expectedResult);

      const result = await service.submitAssessment(tenantId, data);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.selfAssessment.upsert).toHaveBeenCalledWith({
        where: {
          cycleId_employeeId_assessorId_coreValueId: {
            cycleId,
            employeeId,
            assessorId,
            coreValueId,
          },
        },
        update: { rating: data.rating, comment: data.comment },
        create: { tenantId, ...data },
      });
    });

    it('should update an existing assessment (upsert update path)', async () => {
      const data = {
        cycleId,
        employeeId,
        assessorId,
        coreValueId,
        rating: 9,
        comment: 'Updated rating',
        assessmentType: AssessmentType.MANAGER as any,
      };

      const updatedResult = {
        id: 'sa-001',
        tenantId,
        ...data,
        updatedAt: new Date(),
      };

      mockPrismaService.selfAssessment.upsert.mockResolvedValue(updatedResult);

      const result = await service.submitAssessment(tenantId, data);

      expect(result.rating).toBe(9);
      expect(result.comment).toBe('Updated rating');
      // The upsert's update payload should only contain rating and comment
      const upsertCall = mockPrismaService.selfAssessment.upsert.mock.calls[0][0];
      expect(upsertCall.update).toEqual({ rating: 9, comment: 'Updated rating' });
    });

    it('should handle assessment without a comment', async () => {
      const data = {
        cycleId,
        employeeId,
        assessorId,
        coreValueId,
        rating: 7,
        comment: undefined,
        assessmentType: AssessmentType.SELF as any,
      };

      mockPrismaService.selfAssessment.upsert.mockResolvedValue({ id: 'sa-001', ...data });

      await service.submitAssessment(tenantId, data);

      const upsertCall = mockPrismaService.selfAssessment.upsert.mock.calls[0][0];
      expect(upsertCall.update.comment).toBeUndefined();
    });
  });

  // -------------------------------------------------------
  // getGapAnalysis()
  // -------------------------------------------------------
  describe('getGapAnalysis', () => {
    it('should calculate gap between self and manager ratings per core value', async () => {
      const assessments = [
        {
          id: 'sa-1',
          coreValueId: 'cv-innovation',
          coreValue: { name: 'Innovation' },
          assessmentType: AssessmentType.SELF,
          rating: 8,
        },
        {
          id: 'sa-2',
          coreValueId: 'cv-innovation',
          coreValue: { name: 'Innovation' },
          assessmentType: AssessmentType.MANAGER,
          rating: 6,
        },
        {
          id: 'sa-3',
          coreValueId: 'cv-teamwork',
          coreValue: { name: 'Teamwork' },
          assessmentType: AssessmentType.SELF,
          rating: 7,
        },
        {
          id: 'sa-4',
          coreValueId: 'cv-teamwork',
          coreValue: { name: 'Teamwork' },
          assessmentType: AssessmentType.MANAGER,
          rating: 9,
        },
      ];

      mockPrismaService.selfAssessment.findMany.mockResolvedValue(assessments);

      const result = await service.getGapAnalysis(tenantId, cycleId, employeeId);

      expect(result).toHaveLength(2);

      const innovation = result.find((r) => r.valueName === 'Innovation');
      expect(innovation).toBeDefined();
      expect(innovation!.selfRating).toBe(8);
      expect(innovation!.managerRating).toBe(6);
      expect(innovation!.gap).toBe(2); // 8 - 6

      const teamwork = result.find((r) => r.valueName === 'Teamwork');
      expect(teamwork).toBeDefined();
      expect(teamwork!.selfRating).toBe(7);
      expect(teamwork!.managerRating).toBe(9);
      expect(teamwork!.gap).toBe(-2); // 7 - 9
    });

    it('should return gap as null when only self rating exists', async () => {
      const assessments = [
        {
          id: 'sa-1',
          coreValueId: 'cv-innovation',
          coreValue: { name: 'Innovation' },
          assessmentType: AssessmentType.SELF,
          rating: 8,
        },
      ];

      mockPrismaService.selfAssessment.findMany.mockResolvedValue(assessments);

      const result = await service.getGapAnalysis(tenantId, cycleId, employeeId);

      expect(result).toHaveLength(1);
      expect(result[0].selfRating).toBe(8);
      expect(result[0].managerRating).toBeNull();
      expect(result[0].gap).toBeNull();
    });

    it('should return gap as null when only manager rating exists', async () => {
      const assessments = [
        {
          id: 'sa-1',
          coreValueId: 'cv-teamwork',
          coreValue: { name: 'Teamwork' },
          assessmentType: AssessmentType.MANAGER,
          rating: 7,
        },
      ];

      mockPrismaService.selfAssessment.findMany.mockResolvedValue(assessments);

      const result = await service.getGapAnalysis(tenantId, cycleId, employeeId);

      expect(result).toHaveLength(1);
      expect(result[0].selfRating).toBeNull();
      expect(result[0].managerRating).toBe(7);
      expect(result[0].gap).toBeNull();
    });

    it('should return an empty array when no assessments exist', async () => {
      mockPrismaService.selfAssessment.findMany.mockResolvedValue([]);

      const result = await service.getGapAnalysis(tenantId, cycleId, employeeId);

      expect(result).toEqual([]);
    });

    it('should query with the correct tenant, cycle, and employee filters', async () => {
      mockPrismaService.selfAssessment.findMany.mockResolvedValue([]);

      await service.getGapAnalysis(tenantId, cycleId, employeeId);

      expect(mockPrismaService.selfAssessment.findMany).toHaveBeenCalledWith({
        where: { tenantId, cycleId, employeeId },
        include: { coreValue: true },
      });
    });

    it('should handle multiple core values correctly', async () => {
      const assessments = [
        {
          id: 'sa-1',
          coreValueId: 'cv-1',
          coreValue: { name: 'Innovation' },
          assessmentType: AssessmentType.SELF,
          rating: 8,
        },
        {
          id: 'sa-2',
          coreValueId: 'cv-1',
          coreValue: { name: 'Innovation' },
          assessmentType: AssessmentType.MANAGER,
          rating: 7,
        },
        {
          id: 'sa-3',
          coreValueId: 'cv-2',
          coreValue: { name: 'Integrity' },
          assessmentType: AssessmentType.SELF,
          rating: 9,
        },
        {
          id: 'sa-4',
          coreValueId: 'cv-2',
          coreValue: { name: 'Integrity' },
          assessmentType: AssessmentType.MANAGER,
          rating: 9,
        },
        {
          id: 'sa-5',
          coreValueId: 'cv-3',
          coreValue: { name: 'Collaboration' },
          assessmentType: AssessmentType.SELF,
          rating: 5,
        },
      ];

      mockPrismaService.selfAssessment.findMany.mockResolvedValue(assessments);

      const result = await service.getGapAnalysis(tenantId, cycleId, employeeId);

      expect(result).toHaveLength(3);

      const innovation = result.find((r) => r.valueName === 'Innovation');
      expect(innovation!.gap).toBe(1); // 8 - 7

      const integrity = result.find((r) => r.valueName === 'Integrity');
      expect(integrity!.gap).toBe(0); // 9 - 9

      const collaboration = result.find((r) => r.valueName === 'Collaboration');
      expect(collaboration!.gap).toBeNull(); // only self rating
    });
  });
});
