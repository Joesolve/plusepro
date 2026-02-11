import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class RecognitionsService {
  constructor(private prisma: PrismaService) {}
  async create(tenantId: string, senderId: string, data: { receiverId: string; coreValueId: string; message: string }) {
    return this.prisma.recognition.create({ data: { tenantId, senderId, ...data }, include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }, receiver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }, coreValue: { select: { id: true, name: true } } } });
  }
  async getFeed(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit; const where = { tenantId, isPublic: true };
    const [recs, total] = await Promise.all([this.prisma.recognition.findMany({ where, skip, take: limit, include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }, receiver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }, coreValue: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } }), this.prisma.recognition.count({ where })]);
    return { data: recs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
  async getUserStats(tenantId: string, userId: string) {
    const stats = await this.prisma.recognition.groupBy({ by: ['coreValueId'], where: { tenantId, receiverId: userId }, _count: { id: true } });
    const cvs = await this.prisma.coreValue.findMany({ where: { tenantId } });
    const m = new Map(cvs.map((c) => [c.id, c.name]));
    return stats.map((s) => ({ coreValueId: s.coreValueId, coreValueName: m.get(s.coreValueId) || 'Unknown', count: s._count.id }));
  }
  async getActivityByCoreValue(tenantId: string) {
    const stats = await this.prisma.recognition.groupBy({ by: ['coreValueId'], where: { tenantId }, _count: { id: true } });
    const cvs = await this.prisma.coreValue.findMany({ where: { tenantId } });
    const m = new Map(cvs.map((c) => [c.id, c.name]));
    return stats.map((s) => ({ coreValueId: s.coreValueId, coreValueName: m.get(s.coreValueId) || 'Unknown', count: s._count.id }));
  }
}
