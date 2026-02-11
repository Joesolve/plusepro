import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SuggestionsService', () => {
  let service: SuggestionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    suggestion: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SuggestionsService>(SuggestionsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a suggestion with userId', async () => {
      const expected = {
        id: 'sug-1',
        tenantId: 'tenant-1',
        text: 'Better snacks in the break room',
        userId: 'user-1',
      };
      mockPrismaService.suggestion.create.mockResolvedValue(expected);

      const result = await service.create('tenant-1', 'Better snacks in the break room', 'user-1');

      expect(result).toEqual(expected);
      expect(mockPrismaService.suggestion.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          text: 'Better snacks in the break room',
          userId: 'user-1',
        },
      });
    });

    it('should create an anonymous suggestion without userId', async () => {
      const expected = {
        id: 'sug-2',
        tenantId: 'tenant-1',
        text: 'Anonymous feedback',
        userId: undefined,
      };
      mockPrismaService.suggestion.create.mockResolvedValue(expected);

      const result = await service.create('tenant-1', 'Anonymous feedback');

      expect(result).toEqual(expected);
      expect(mockPrismaService.suggestion.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          text: 'Anonymous feedback',
          userId: undefined,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated suggestions with default page and limit', async () => {
      const suggestions = [
        { id: 'sug-1', text: 'Suggestion 1' },
        { id: 'sug-2', text: 'Suggestion 2' },
      ];
      mockPrismaService.suggestion.findMany.mockResolvedValue(suggestions);
      mockPrismaService.suggestion.count.mockResolvedValue(2);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual({
        data: suggestions,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });
      expect(mockPrismaService.suggestion.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return paginated suggestions with custom page and limit', async () => {
      const suggestions = [{ id: 'sug-3', text: 'Suggestion 3' }];
      mockPrismaService.suggestion.findMany.mockResolvedValue(suggestions);
      mockPrismaService.suggestion.count.mockResolvedValue(25);

      const result = await service.findAll('tenant-1', 3, 10);

      expect(result).toEqual({
        data: suggestions,
        meta: { total: 25, page: 3, limit: 10, totalPages: 3 },
      });
      expect(mockPrismaService.suggestion.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        skip: 20,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by status when provided', async () => {
      mockPrismaService.suggestion.findMany.mockResolvedValue([]);
      mockPrismaService.suggestion.count.mockResolvedValue(0);

      await service.findAll('tenant-1', 1, 20, 'REVIEWED' as any);

      expect(mockPrismaService.suggestion.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', status: 'REVIEWED' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrismaService.suggestion.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', status: 'REVIEWED' },
      });
    });

    it('should calculate totalPages correctly with ceiling division', async () => {
      mockPrismaService.suggestion.findMany.mockResolvedValue([]);
      mockPrismaService.suggestion.count.mockResolvedValue(21);

      const result = await service.findAll('tenant-1', 1, 10);

      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('updateStatus', () => {
    it('should update suggestion status with admin note', async () => {
      const existingSuggestion = { id: 'sug-1', tenantId: 'tenant-1', text: 'Some text' };
      const updatedSuggestion = { ...existingSuggestion, status: 'REVIEWED', adminNote: 'Looks good' };
      mockPrismaService.suggestion.findFirst.mockResolvedValue(existingSuggestion);
      mockPrismaService.suggestion.update.mockResolvedValue(updatedSuggestion);

      const result = await service.updateStatus('sug-1', 'tenant-1', 'REVIEWED' as any, 'Looks good');

      expect(result).toEqual(updatedSuggestion);
      expect(mockPrismaService.suggestion.findFirst).toHaveBeenCalledWith({
        where: { id: 'sug-1', tenantId: 'tenant-1' },
      });
      expect(mockPrismaService.suggestion.update).toHaveBeenCalledWith({
        where: { id: 'sug-1' },
        data: { status: 'REVIEWED', adminNote: 'Looks good' },
      });
    });

    it('should update suggestion status without admin note', async () => {
      const existingSuggestion = { id: 'sug-1', tenantId: 'tenant-1', text: 'Some text' };
      const updatedSuggestion = { ...existingSuggestion, status: 'IMPLEMENTED', adminNote: undefined };
      mockPrismaService.suggestion.findFirst.mockResolvedValue(existingSuggestion);
      mockPrismaService.suggestion.update.mockResolvedValue(updatedSuggestion);

      const result = await service.updateStatus('sug-1', 'tenant-1', 'IMPLEMENTED' as any);

      expect(result).toEqual(updatedSuggestion);
      expect(mockPrismaService.suggestion.update).toHaveBeenCalledWith({
        where: { id: 'sug-1' },
        data: { status: 'IMPLEMENTED', adminNote: undefined },
      });
    });

    it('should throw NotFoundException when suggestion does not exist', async () => {
      mockPrismaService.suggestion.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', 'tenant-1', 'REVIEWED' as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTags', () => {
    it('should update tags and category on a suggestion', async () => {
      const existingSuggestion = { id: 'sug-1', tenantId: 'tenant-1', text: 'Some text' };
      const updatedSuggestion = { ...existingSuggestion, tags: ['culture', 'office'], category: 'Workplace' };
      mockPrismaService.suggestion.findFirst.mockResolvedValue(existingSuggestion);
      mockPrismaService.suggestion.update.mockResolvedValue(updatedSuggestion);

      const result = await service.updateTags('sug-1', 'tenant-1', ['culture', 'office'], 'Workplace');

      expect(result).toEqual(updatedSuggestion);
      expect(mockPrismaService.suggestion.update).toHaveBeenCalledWith({
        where: { id: 'sug-1' },
        data: { tags: ['culture', 'office'], category: 'Workplace' },
      });
    });

    it('should throw NotFoundException when suggestion does not exist', async () => {
      mockPrismaService.suggestion.findFirst.mockResolvedValue(null);

      await expect(
        service.updateTags('nonexistent', 'tenant-1', ['tag']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getKeywordFrequency', () => {
    it('should return keyword frequency sorted by count descending', async () => {
      mockPrismaService.suggestion.findMany.mockResolvedValue([
        { text: 'Better communication between teams' },
        { text: 'Communication should improve significantly' },
        { text: 'Teams need better tools for collaboration' },
      ]);

      const result = await service.getKeywordFrequency('tenant-1');

      expect(mockPrismaService.suggestion.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        select: { text: true },
      });

      // 'better' appears 2 times, 'communication' appears 2 times, 'teams' appears 2 times
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      // Verify sorted descending by count
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].count).toBeGreaterThanOrEqual(result[i].count);
      }
      // Verify structure
      expect(result[0]).toHaveProperty('word');
      expect(result[0]).toHaveProperty('count');
    });

    it('should filter out stop words and short words', async () => {
      mockPrismaService.suggestion.findMany.mockResolvedValue([
        { text: 'The company is a great place to work and we should do more of it' },
      ]);

      const result = await service.getKeywordFrequency('tenant-1');

      const words = result.map((r: { word: string }) => r.word);
      // Stop words like 'the', 'is', 'a', 'to', 'and', 'we', 'of', 'it' should be excluded
      expect(words).not.toContain('the');
      expect(words).not.toContain('is');
      expect(words).not.toContain('and');
      expect(words).not.toContain('we');
      // Short words (2 chars or less) should be excluded
      expect(words.every((w: string) => w.length > 2)).toBe(true);
    });

    it('should return at most 30 keywords', async () => {
      const longTexts = Array.from({ length: 50 }, (_, i) => ({
        text: `uniqueword${i} appears here`,
      }));
      mockPrismaService.suggestion.findMany.mockResolvedValue(longTexts);

      const result = await service.getKeywordFrequency('tenant-1');

      expect(result.length).toBeLessThanOrEqual(30);
    });

    it('should return empty array when no suggestions exist', async () => {
      mockPrismaService.suggestion.findMany.mockResolvedValue([]);

      const result = await service.getKeywordFrequency('tenant-1');

      expect(result).toEqual([]);
    });
  });
});
