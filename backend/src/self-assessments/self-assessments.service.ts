import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssessmentType } from '@prisma/client';
@Injectable()
export class SelfAssessmentsService {
  constructor(private prisma: PrismaService) {}
  async createCycle(tenantId: string, data: { name: string; startDate: Date; endDate: Date }) {
    return this.prisma.assessmentCycle.create({ data: { tenantId, ...data } });
  }
  async getActiveCycles(tenantId: string) {
    return this.prisma.assessmentCycle.findMany({ where: { tenantId, isActive: true }, orderBy: { startDate: 'desc' } });
  }
  async submitAssessment(tenantId: string, data: { cycleId: string; employeeId: string; assessorId: string; coreValueId: string; rating: number; comment?: string; assessmentType: AssessmentType }) {
    return this.prisma.selfAssessment.upsert({
      where: { cycleId_employeeId_assessorId_coreValueId: { cycleId: data.cycleId, employeeId: data.employeeId, assessorId: data.assessorId, coreValueId: data.coreValueId } },
      update: { rating: data.rating, comment: data.comment },
      create: { tenantId, ...data },
    });
  }
  async getGapAnalysis(tenantId: string, cycleId: string, employeeId: string) {
    const assessments = await this.prisma.selfAssessment.findMany({ where: { tenantId, cycleId, employeeId }, include: { coreValue: true } });
    const valueMap = new Map<string, { valueName: string; selfRating: number | null; managerRating: number | null }>();
    for (const a of assessments) {
      if (!valueMap.has(a.coreValueId)) valueMap.set(a.coreValueId, { valueName: a.coreValue.name, selfRating: null, managerRating: null });
      const entry = valueMap.get(a.coreValueId)!;
      if (a.assessmentType === AssessmentType.SELF) entry.selfRating = a.rating; else entry.managerRating = a.rating;
    }
    return Array.from(valueMap.values()).map((v) => ({ ...v, gap: v.selfRating !== null && v.managerRating !== null ? v.selfRating - v.managerRating : null }));
  }
}
