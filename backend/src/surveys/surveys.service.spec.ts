import { Test, TestingModule } from '@nestjs/testing';
import { SurveysService } from './surveys.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Mock SurveyStatus enum to avoid importing from @prisma/client
const SurveyStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED',
} as const;

describe('SurveysService', () => {
  let service: SurveysService;
  let prisma: PrismaService;

  const mockPrismaService = {
    survey: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    surveyAssignment: {
      createMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    surveyResponse: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const tenantId = 'tenant-001';
  const userId = 'user-001';
  const surveyId = 'survey-001';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveysService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SurveysService>(SurveysService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -------------------------------------------------------
  // create()
  // -------------------------------------------------------
  describe('create', () => {
    it('should create a survey with nested questions', async () => {
      const dto = {
        title: 'Q1 Engagement Survey',
        description: 'Quarterly pulse check',
        isAnonymous: true,
        questions: [
          { text: 'How satisfied are you?', type: 'LIKERT_SCALE', isRequired: true },
          { text: 'Any feedback?', type: 'OPEN_TEXT', isRequired: false, sortOrder: 1 },
        ],
      };

      const expectedResult = {
        id: surveyId,
        tenantId,
        createdById: userId,
        title: dto.title,
        description: dto.description,
        isAnonymous: true,
        status: SurveyStatus.DRAFT,
        questions: [
          { id: 'q-1', text: 'How satisfied are you?', type: 'LIKERT_SCALE', isRequired: true, sortOrder: 0 },
          { id: 'q-2', text: 'Any feedback?', type: 'OPEN_TEXT', isRequired: false, sortOrder: 1 },
        ],
      };

      mockPrismaService.survey.create.mockResolvedValue(expectedResult);

      const result = await service.create(tenantId, userId, dto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.survey.create).toHaveBeenCalledTimes(1);

      const createCall = mockPrismaService.survey.create.mock.calls[0][0];
      expect(createCall.data.tenantId).toBe(tenantId);
      expect(createCall.data.createdById).toBe(userId);
      expect(createCall.data.title).toBe(dto.title);
      expect(createCall.data.questions.create).toHaveLength(2);
      expect(createCall.data.questions.create[0].text).toBe('How satisfied are you?');
      expect(createCall.data.questions.create[0].sortOrder).toBe(0); // defaults to index
      expect(createCall.data.questions.create[1].sortOrder).toBe(1);
      expect(createCall.include.questions.orderBy.sortOrder).toBe('asc');
    });

    it('should create a survey with an empty questions array when no questions provided', async () => {
      const dto = { title: 'Empty Survey', description: null };
      const expectedResult = {
        id: surveyId,
        tenantId,
        createdById: userId,
        title: dto.title,
        status: SurveyStatus.DRAFT,
        questions: [],
      };

      mockPrismaService.survey.create.mockResolvedValue(expectedResult);

      const result = await service.create(tenantId, userId, dto);

      expect(result).toEqual(expectedResult);
      const createCall = mockPrismaService.survey.create.mock.calls[0][0];
      expect(createCall.data.questions.create).toEqual([]);
    });

    it('should default isRequired to true when not specified', async () => {
      const dto = {
        title: 'Test Survey',
        questions: [{ text: 'Rate us', type: 'LIKERT_SCALE' }],
      };

      mockPrismaService.survey.create.mockResolvedValue({ id: surveyId });

      await service.create(tenantId, userId, dto);

      const createCall = mockPrismaService.survey.create.mock.calls[0][0];
      expect(createCall.data.questions.create[0].isRequired).toBe(true);
    });
  });

  // -------------------------------------------------------
  // findAll()
  // -------------------------------------------------------
  describe('findAll', () => {
    it('should return paginated results with default page and limit', async () => {
      const surveys = [
        { id: 'survey-1', title: 'Survey 1', _count: { questions: 5, responses: 10, assignments: 20 } },
        { id: 'survey-2', title: 'Survey 2', _count: { questions: 3, responses: 7, assignments: 15 } },
      ];

      mockPrismaService.survey.findMany.mockResolvedValue(surveys);
      mockPrismaService.survey.count.mockResolvedValue(2);

      const result = await service.findAll(tenantId);

      expect(result).toEqual({
        data: surveys,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });

      expect(mockPrismaService.survey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(mockPrismaService.survey.count).toHaveBeenCalledWith({ where: { tenantId } });
    });

    it('should correctly calculate skip for page 3 with limit 10', async () => {
      mockPrismaService.survey.findMany.mockResolvedValue([]);
      mockPrismaService.survey.count.mockResolvedValue(25);

      const result = await service.findAll(tenantId, 3, 10);

      expect(result.meta).toEqual({ total: 25, page: 3, limit: 10, totalPages: 3 });
      expect(mockPrismaService.survey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should return totalPages as 0 when there are no surveys', async () => {
      mockPrismaService.survey.findMany.mockResolvedValue([]);
      mockPrismaService.survey.count.mockResolvedValue(0);

      const result = await service.findAll(tenantId);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should ceil totalPages when total is not evenly divisible', async () => {
      mockPrismaService.survey.findMany.mockResolvedValue([]);
      mockPrismaService.survey.count.mockResolvedValue(21);

      const result = await service.findAll(tenantId, 1, 10);

      expect(result.meta.totalPages).toBe(3); // Math.ceil(21/10) = 3
    });
  });

  // -------------------------------------------------------
  // findOne()
  // -------------------------------------------------------
  describe('findOne', () => {
    it('should return a survey when found', async () => {
      const survey = {
        id: surveyId,
        tenantId,
        title: 'Test Survey',
        status: SurveyStatus.DRAFT,
        questions: [],
        _count: { responses: 0, assignments: 0 },
      };

      mockPrismaService.survey.findFirst.mockResolvedValue(survey);

      const result = await service.findOne(surveyId, tenantId);

      expect(result).toEqual(survey);
      expect(mockPrismaService.survey.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: surveyId, tenantId },
        }),
      );
    });

    it('should throw NotFoundException when survey does not exist', async () => {
      mockPrismaService.survey.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------
  // publish()
  // -------------------------------------------------------
  describe('publish', () => {
    it('should change status from DRAFT to PUBLISHED', async () => {
      const draftSurvey = {
        id: surveyId,
        tenantId,
        status: SurveyStatus.DRAFT,
        questions: [],
        _count: { responses: 0, assignments: 0 },
      };
      const publishedSurvey = {
        ...draftSurvey,
        status: SurveyStatus.PUBLISHED,
        publishedAt: new Date('2026-02-10'),
      };

      mockPrismaService.survey.findFirst.mockResolvedValue(draftSurvey);
      mockPrismaService.survey.update.mockResolvedValue(publishedSurvey);

      const result = await service.publish(surveyId, tenantId);

      expect(result.status).toBe(SurveyStatus.PUBLISHED);
      expect(mockPrismaService.survey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: surveyId },
          data: expect.objectContaining({
            status: SurveyStatus.PUBLISHED,
            publishedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw BadRequestException when survey is already PUBLISHED', async () => {
      const publishedSurvey = {
        id: surveyId,
        tenantId,
        status: SurveyStatus.PUBLISHED,
        questions: [],
        _count: { responses: 0, assignments: 0 },
      };

      mockPrismaService.survey.findFirst.mockResolvedValue(publishedSurvey);

      await expect(service.publish(surveyId, tenantId)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.survey.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when survey is CLOSED', async () => {
      const closedSurvey = {
        id: surveyId,
        tenantId,
        status: SurveyStatus.CLOSED,
        questions: [],
        _count: { responses: 0, assignments: 0 },
      };

      mockPrismaService.survey.findFirst.mockResolvedValue(closedSurvey);

      await expect(service.publish(surveyId, tenantId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when survey does not exist', async () => {
      mockPrismaService.survey.findFirst.mockResolvedValue(null);

      await expect(service.publish('nonexistent', tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------
  // close()
  // -------------------------------------------------------
  describe('close', () => {
    it('should change status to CLOSED', async () => {
      const publishedSurvey = {
        id: surveyId,
        tenantId,
        status: SurveyStatus.PUBLISHED,
        questions: [],
        _count: { responses: 5, assignments: 10 },
      };
      const closedSurvey = { ...publishedSurvey, status: SurveyStatus.CLOSED };

      mockPrismaService.survey.findFirst.mockResolvedValue(publishedSurvey);
      mockPrismaService.survey.update.mockResolvedValue(closedSurvey);

      const result = await service.close(surveyId, tenantId);

      expect(result.status).toBe(SurveyStatus.CLOSED);
      expect(mockPrismaService.survey.update).toHaveBeenCalledWith({
        where: { id: surveyId },
        data: { status: SurveyStatus.CLOSED },
      });
    });

    it('should throw NotFoundException when survey does not exist', async () => {
      mockPrismaService.survey.findFirst.mockResolvedValue(null);

      await expect(service.close('nonexistent', tenantId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.survey.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // getCompletionRate()
  // -------------------------------------------------------
  describe('getCompletionRate', () => {
    it('should return completion rate when assignments exist', async () => {
      const survey = {
        id: surveyId,
        tenantId,
        status: SurveyStatus.PUBLISHED,
        questions: [],
        _count: { responses: 0, assignments: 0 },
      };

      mockPrismaService.survey.findFirst.mockResolvedValue(survey);
      mockPrismaService.surveyAssignment.count
        .mockResolvedValueOnce(50)   // total assignments
        .mockResolvedValueOnce(35);  // completed assignments

      const result = await service.getCompletionRate(surveyId, tenantId);

      expect(result).toEqual({ total: 50, completed: 35, rate: 70 });
      expect(mockPrismaService.surveyAssignment.count).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.surveyAssignment.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { surveyId } }),
      );
      expect(mockPrismaService.surveyAssignment.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { surveyId, status: 'COMPLETED' } }),
      );
    });

    it('should return rate of 0 when there are no assignments', async () => {
      const survey = {
        id: surveyId,
        tenantId,
        status: SurveyStatus.DRAFT,
        questions: [],
        _count: { responses: 0, assignments: 0 },
      };

      mockPrismaService.survey.findFirst.mockResolvedValue(survey);
      mockPrismaService.surveyAssignment.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getCompletionRate(surveyId, tenantId);

      expect(result).toEqual({ total: 0, completed: 0, rate: 0 });
    });

    it('should round the rate to the nearest integer', async () => {
      const survey = {
        id: surveyId,
        tenantId,
        status: SurveyStatus.PUBLISHED,
        questions: [],
        _count: { responses: 0, assignments: 0 },
      };

      mockPrismaService.survey.findFirst.mockResolvedValue(survey);
      mockPrismaService.surveyAssignment.count
        .mockResolvedValueOnce(3)   // total
        .mockResolvedValueOnce(1);  // completed  => 33.33...%

      const result = await service.getCompletionRate(surveyId, tenantId);

      expect(result.rate).toBe(33); // Math.round(33.33) = 33
    });

    it('should throw NotFoundException when survey does not exist', async () => {
      mockPrismaService.survey.findFirst.mockResolvedValue(null);

      await expect(service.getCompletionRate('nonexistent', tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------
  // update()
  // -------------------------------------------------------
  describe('update', () => {
    it('should throw BadRequestException when trying to edit a CLOSED survey', async () => {
      const closedSurvey = {
        id: surveyId,
        tenantId,
        status: SurveyStatus.CLOSED,
        questions: [],
        _count: { responses: 0, assignments: 0 },
      };

      mockPrismaService.survey.findFirst.mockResolvedValue(closedSurvey);

      await expect(service.update(surveyId, tenantId, { title: 'New Title' })).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.survey.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // submitResponse()
  // -------------------------------------------------------
  describe('submitResponse', () => {
    it('should throw BadRequestException when survey is not PUBLISHED', async () => {
      const draftSurvey = {
        id: surveyId,
        tenantId,
        status: SurveyStatus.DRAFT,
        isAnonymous: false,
        questions: [],
        _count: { responses: 0, assignments: 0 },
      };

      mockPrismaService.survey.findFirst.mockResolvedValue(draftSurvey);

      await expect(
        service.submitResponse(surveyId, tenantId, userId, []),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
