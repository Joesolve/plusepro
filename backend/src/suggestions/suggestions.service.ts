import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SuggestionStatus } from '@prisma/client';
@Injectable()
export class SuggestionsService {
  constructor(private prisma: PrismaService) {}
  async create(tenantId: string, text: string, userId?: string) { return this.prisma.suggestion.create({ data: { tenantId, text, userId } }); }
  async findAll(tenantId: string, page = 1, limit = 20, status?: SuggestionStatus) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId }; if (status) where.status = status;
    const [suggestions, total] = await Promise.all([this.prisma.suggestion.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }), this.prisma.suggestion.count({ where })]);
    return { data: suggestions, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
  async updateStatus(id: string, tenantId: string, status: SuggestionStatus, adminNote?: string) {
    const s = await this.prisma.suggestion.findFirst({ where: { id, tenantId } }); if (!s) throw new NotFoundException('Suggestion not found');
    return this.prisma.suggestion.update({ where: { id }, data: { status, adminNote } });
  }
  async updateTags(id: string, tenantId: string, tags: string[], category?: string) {
    const s = await this.prisma.suggestion.findFirst({ where: { id, tenantId } }); if (!s) throw new NotFoundException('Suggestion not found');
    return this.prisma.suggestion.update({ where: { id }, data: { tags, category } });
  }
  async getKeywordFrequency(tenantId: string) {
    const suggestions = await this.prisma.suggestion.findMany({ where: { tenantId }, select: { text: true } });
    const stops = new Set(['the','a','an','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','to','of','in','for','on','with','at','by','from','as','and','but','or','not','no','so','yet','if','when','where','how','what','which','who','this','that','these','those','i','me','my','we','our','you','your','he','him','his','she','her','it','its','they','them','their','about','also','up','out','then','there','than','too','very','just']);
    const counts: Record<string, number> = {};
    for (const s of suggestions) { for (const w of s.text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)) { if (w.length > 2 && !stops.has(w)) counts[w] = (counts[w] || 0) + 1; } }
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 30).map(([word, count]) => ({ word, count }));
  }
}
