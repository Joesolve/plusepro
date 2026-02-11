import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    surveyResponse: {
      findMany: jest.fn(),
    },
    department: {
      findMany: jest.fn(),
    },
    surveyAnswer: {
      findMany: jest.fn(),
    },
    survey: {
      findMany: jest.fn(),
    },
    surveyQuestion: {
      findMany: jest.fn(),
    },
    assessmentCycle: {
      findMany: jest.fn(),
    },
  };

  const tenantId = 'tenant-001';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -------------------------------------------------------
  // getEngagementTrend()
  // -------------------------------------------------------
  describe('getEngagementTrend', () => {
    it('should return monthly averages from survey response answers', async () => {
      const jan = new Date('2026-01-15');
      const feb = new Date('2026-02-05');

      const responses = [
        {
          id: 'r1',
          createdAt: jan,
          answers: [
            { numericValue: 4 },
            { numericValue: 5 },
          ],
        },
        {
          id: 'r2',
          createdAt: jan,
          answers: [
            { numericValue: 3 },
          ],
        },
        {
          id: 'r3',
          createdAt: feb,
          answers: [
            { numericValue: 5 },
            { numericValue: 5 },
          ],
        },
      ];

      mockPrismaService.surveyResponse.findMany.mockResolvedValue(responses);

      const result = await service.getEngagementTrend(tenantId, 12);

      expect(result).toHaveLength(2);

      // January: (4 + 5 + 3) / 3 = 4.00
      const janEntry = result.find((r) => r.month === '2026-01');
      expect(janEntry).toBeDefined();
      expect(janEntry!.averageScore).toBe(4);
      expect(janEntry!.responseCount).toBe(3);

      // February: (5 + 5) / 2 = 5.00
      const febEntry = result.find((r) => r.month === '2026-02');
      expect(febEntry).toBeDefined();
      expect(febEntry!.averageScore).toBe(5);
      expect(febEntry!.responseCount).toBe(2);
    });

    it('should return an empty array when there are no responses', async () => {
      mockPrismaService.surveyResponse.findMany.mockResolvedValue([]);

      const result = await service.getEngagementTrend(tenantId);

      expect(result).toEqual([]);
    });

    it('should skip answers with null numericValue', async () => {
      const responses = [
        {
          id: 'r1',
          createdAt: new Date('2026-01-10'),
          answers: [
            { numericValue: null },
            { numericValue: 4 },
          ],
        },
      ];

      mockPrismaService.surveyResponse.findMany.mockResolvedValue(responses);

      const result = await service.getEngagementTrend(tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].averageScore).toBe(4);
      expect(result[0].responseCount).toBe(1);
    });

    it('should query with the correct date range filter', async () => {
      mockPrismaService.surveyResponse.findMany.mockResolvedValue([]);

      const beforeCall = new Date();
      await service.getEngagementTrend(tenantId, 6);

      const callArgs = mockPrismaService.surveyResponse.findMany.mock.calls[0][0];
      expect(callArgs.where.survey.tenantId).toBe(tenantId);
      expect(callArgs.where.createdAt.gte).toBeInstanceOf(Date);
      // The start date should be roughly 6 months before now
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const diff = Math.abs(callArgs.where.createdAt.gte.getTime() - sixMonthsAgo.getTime());
      expect(diff).toBeLessThan(1000); // within 1 second tolerance
    });

    it('should default to 12 months when months parameter is not provided', async () => {
      mockPrismaService.surveyResponse.findMany.mockResolvedValue([]);

      await service.getEngagementTrend(tenantId);

      const callArgs = mockPrismaService.surveyResponse.findMany.mock.calls[0][0];
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const diff = Math.abs(callArgs.where.createdAt.gte.getTime() - twelveMonthsAgo.getTime());
      expect(diff).toBeLessThan(1000);
    });
  });

  // -------------------------------------------------------
  // getDepartmentHeatmap()
  // -------------------------------------------------------
  describe('getDepartmentHeatmap', () => {
    it('should return department scores grouped by core value', async () => {
      const departments = [
        {
          id: 'dept-1',
          name: 'Engineering',
          users: [{ id: 'user-1' }, { id: 'user-2' }],
        },
        {
          id: 'dept-2',
          name: 'Marketing',
          users: [{ id: 'user-3' }],
        },
      ];

      const engineeringAnswers = [
        {
          numericValue: 4,
          question: { coreValue: { name: 'Innovation' } },
        },
        {
          numericValue: 5,
          question: { coreValue: { name: 'Innovation' } },
        },
        {
          numericValue: 3,
          question: { coreValue: { name: 'Teamwork' } },
        },
      ];

      const marketingAnswers = [
        {
          numericValue: 5,
          question: { coreValue: { name: 'Innovation' } },
        },
      ];

      mockPrismaService.department.findMany.mockResolvedValue(departments);
      mockPrismaService.surveyAnswer.findMany
        .mockResolvedValueOnce(engineeringAnswers)
        .mockResolvedValueOnce(marketingAnswers);

      const result = await service.getDepartmentHeatmap(tenantId);

      expect(result).toHaveLength(2);

      // Engineering
      const eng = result.find((r) => r.departmentId === 'dept-1');
      expect(eng).toBeDefined();
      expect(eng!.departmentName).toBe('Engineering');
      const engInnovation = eng!.scores.find((s) => s.value === 'Innovation');
      expect(engInnovation!.average).toBe(4.5); // (4+5)/2
      const engTeamwork = eng!.scores.find((s) => s.value === 'Teamwork');
      expect(engTeamwork!.average).toBe(3);

      // Marketing
      const mkt = result.find((r) => r.departmentId === 'dept-2');
      expect(mkt).toBeDefined();
      expect(mkt!.scores).toHaveLength(1);
      expect(mkt!.scores[0].average).toBe(5);
    });

    it('should skip departments with no users', async () => {
      const departments = [
        { id: 'dept-1', name: 'Empty Dept', users: [] },
        { id: 'dept-2', name: 'Active Dept', users: [{ id: 'user-1' }] },
      ];

      mockPrismaService.department.findMany.mockResolvedValue(departments);
      mockPrismaService.surveyAnswer.findMany.mockResolvedValue([]);

      const result = await service.getDepartmentHeatmap(tenantId);

      // Only one department queried (the one with users), empty dept skipped
      expect(mockPrismaService.surveyAnswer.findMany).toHaveBeenCalledTimes(1);
      // The active dept has no answers so it still appears but with no scores
      expect(result).toHaveLength(1);
      expect(result[0].departmentId).toBe('dept-2');
      expect(result[0].scores).toEqual([]);
    });

    it('should label answers without a coreValue as General', async () => {
      const departments = [
        { id: 'dept-1', name: 'Sales', users: [{ id: 'user-1' }] },
      ];

      const answers = [
        {
          numericValue: 4,
          question: { coreValue: null },
        },
      ];

      mockPrismaService.department.findMany.mockResolvedValue(departments);
      mockPrismaService.surveyAnswer.findMany.mockResolvedValue(answers);

      const result = await service.getDepartmentHeatmap(tenantId);

      expect(result[0].scores).toHaveLength(1);
      expect(result[0].scores[0].value).toBe('General');
      expect(result[0].scores[0].average).toBe(4);
    });

    it('should return an empty array when there are no departments', async () => {
      mockPrismaService.department.findMany.mockResolvedValue([]);

      const result = await service.getDepartmentHeatmap(tenantId);

      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------
  // getSurveyCompletionRates()
  // -------------------------------------------------------
  describe('getSurveyCompletionRates', () => {
    it('should return completion rates for non-draft surveys', async () => {
      const surveys = [
        {
          id: 'survey-1',
          title: 'Q1 Pulse',
          publishedAt: new Date('2026-01-15'),
          _count: { assignments: 50, responses: 40 },
        },
        {
          id: 'survey-2',
          title: 'Q2 Pulse',
          publishedAt: new Date('2026-02-01'),
          _count: { assignments: 30, responses: 10 },
        },
      ];

      mockPrismaService.survey.findMany.mockResolvedValue(surveys);

      const result = await service.getSurveyCompletionRates(tenantId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        surveyId: 'survey-1',
        title: 'Q1 Pulse',
        publishedAt: surveys[0].publishedAt,
        assignedCount: 50,
        responseCount: 40,
        completionRate: 80,
      });
      expect(result[1].completionRate).toBe(33); // Math.round(10/30 * 100)
    });

    it('should return completionRate 0 when there are no assignments', async () => {
      const surveys = [
        {
          id: 'survey-1',
          title: 'No Assignments',
          publishedAt: new Date('2026-01-01'),
          _count: { assignments: 0, responses: 0 },
        },
      ];

      mockPrismaService.survey.findMany.mockResolvedValue(surveys);

      const result = await service.getSurveyCompletionRates(tenantId);

      expect(result[0].completionRate).toBe(0);
    });

    it('should return an empty array when no non-draft surveys exist', async () => {
      mockPrismaService.survey.findMany.mockResolvedValue([]);

      const result = await service.getSurveyCompletionRates(tenantId);

      expect(result).toEqual([]);
    });

    it('should query only non-DRAFT surveys', async () => {
      mockPrismaService.survey.findMany.mockResolvedValue([]);

      await service.getSurveyCompletionRates(tenantId);

      const callArgs = mockPrismaService.survey.findMany.mock.calls[0][0];
      expect(callArgs.where.tenantId).toBe(tenantId);
      expect(callArgs.where.status).toEqual({ not: 'DRAFT' });
    });
  });

  // -------------------------------------------------------
  // getTopBottomQuestions()
  // -------------------------------------------------------
  describe('getTopBottomQuestions', () => {
    it('should return top and bottom scored questions', async () => {
      const questions = [
        {
          id: 'q-1',
          text: 'I feel valued at work',
          survey: { title: 'Q1 Pulse' },
          answers: [{ numericValue: 5 }, { numericValue: 5 }, { numericValue: 4 }],
        },
        {
          id: 'q-2',
          text: 'I have growth opportunities',
          survey: { title: 'Q1 Pulse' },
          answers: [{ numericValue: 2 }, { numericValue: 1 }, { numericValue: 2 }],
        },
        {
          id: 'q-3',
          text: 'My manager supports me',
          survey: { title: 'Q1 Pulse' },
          answers: [{ numericValue: 4 }, { numericValue: 3 }],
        },
      ];

      mockPrismaService.surveyQuestion.findMany.mockResolvedValue(questions);

      const result = await service.getTopBottomQuestions(tenantId, 2);

      // Top 2: q-1 (avg 4.67), q-3 (avg 3.5)
      expect(result.top).toHaveLength(2);
      expect(result.top[0].questionId).toBe('q-1');
      expect(result.top[0].averageScore).toBeCloseTo(4.67, 2);
      expect(result.top[1].questionId).toBe('q-3');
      expect(result.top[1].averageScore).toBe(3.5);

      // Bottom 2: q-2 (avg 1.67), q-3 (avg 3.5)  -- reversed
      expect(result.bottom).toHaveLength(2);
      expect(result.bottom[0].questionId).toBe('q-2');
      expect(result.bottom[0].averageScore).toBeCloseTo(1.67, 2);
    });

    it('should exclude questions with no responses', async () => {
      const questions = [
        {
          id: 'q-1',
          text: 'Has answers',
          survey: { title: 'Survey' },
          answers: [{ numericValue: 4 }],
        },
        {
          id: 'q-2',
          text: 'No answers',
          survey: { title: 'Survey' },
          answers: [],
        },
      ];

      mockPrismaService.surveyQuestion.findMany.mockResolvedValue(questions);

      const result = await service.getTopBottomQuestions(tenantId);

      expect(result.top).toHaveLength(1);
      expect(result.top[0].questionId).toBe('q-1');
      expect(result.bottom).toHaveLength(1);
    });

    it('should return empty top and bottom when no questions have answers', async () => {
      mockPrismaService.surveyQuestion.findMany.mockResolvedValue([]);

      const result = await service.getTopBottomQuestions(tenantId);

      expect(result.top).toEqual([]);
      expect(result.bottom).toEqual([]);
    });

    it('should default the limit to 5', async () => {
      // Generate 10 questions with descending scores
      const questions = Array.from({ length: 10 }, (_, i) => ({
        id: `q-${i}`,
        text: `Question ${i}`,
        survey: { title: 'Survey' },
        answers: [{ numericValue: 10 - i }],
      }));

      mockPrismaService.surveyQuestion.findMany.mockResolvedValue(questions);

      const result = await service.getTopBottomQuestions(tenantId);

      expect(result.top).toHaveLength(5);
      expect(result.bottom).toHaveLength(5);
      // Highest first in top
      expect(result.top[0].averageScore).toBe(10);
      expect(result.top[4].averageScore).toBe(6);
      // Lowest first in bottom (reversed from end of sorted array)
      expect(result.bottom[0].averageScore).toBe(1);
    });

    it('should query only LIKERT_SCALE and YES_NO question types', async () => {
      mockPrismaService.surveyQuestion.findMany.mockResolvedValue([]);

      await service.getTopBottomQuestions(tenantId);

      const callArgs = mockPrismaService.surveyQuestion.findMany.mock.calls[0][0];
      expect(callArgs.where.survey.tenantId).toBe(tenantId);
      expect(callArgs.where.type).toEqual({ in: ['LIKERT_SCALE', 'YES_NO'] });
    });

    it('should include surveyTitle and responseCount in each result', async () => {
      const questions = [
        {
          id: 'q-1',
          text: 'Rate us',
          survey: { title: 'Employee Pulse' },
          answers: [{ numericValue: 4 }, { numericValue: 5 }],
        },
      ];

      mockPrismaService.surveyQuestion.findMany.mockResolvedValue(questions);

      const result = await service.getTopBottomQuestions(tenantId);

      expect(result.top[0].surveyTitle).toBe('Employee Pulse');
      expect(result.top[0].responseCount).toBe(2);
      expect(result.top[0].text).toBe('Rate us');
    });
  });
});
