import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SurveyStatus } from '@prisma/client';
@Injectable()
export class SurveysService {
  constructor(private prisma: PrismaService) {}
  async create(tenantId: string, createdById: string, dto: any) {
    const { questions, ...surveyData } = dto;
    return this.prisma.survey.create({
      data: { ...surveyData, tenantId, createdById, questions: { create: (questions || []).map((q: any, idx: number) => ({ text: q.text, type: q.type, isRequired: q.isRequired ?? true, sortOrder: q.sortOrder ?? idx, coreValueId: q.coreValueId, options: q.options })) } },
      include: { questions: { orderBy: { sortOrder: 'asc' } } },
    });
  }
  async findAll(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [surveys, total] = await Promise.all([
      this.prisma.survey.findMany({ where: { tenantId }, skip, take: limit, include: { _count: { select: { questions: true, responses: true, assignments: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.survey.count({ where: { tenantId } }),
    ]);
    return { data: surveys, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
  async findOne(id: string, tenantId: string) {
    const survey = await this.prisma.survey.findFirst({ where: { id, tenantId }, include: { questions: { orderBy: { sortOrder: 'asc' }, include: { coreValue: true } }, _count: { select: { responses: true, assignments: true } } } });
    if (!survey) throw new NotFoundException('Survey not found');
    return survey;
  }
  async update(id: string, tenantId: string, dto: any) {
    const survey = await this.findOne(id, tenantId);
    if (survey.status === SurveyStatus.CLOSED) throw new BadRequestException('Cannot edit a closed survey');
    const { questions, ...data } = dto;
    return this.prisma.survey.update({ where: { id }, data, include: { questions: true } });
  }
  async publish(id: string, tenantId: string) {
    const survey = await this.findOne(id, tenantId);
    if (survey.status !== SurveyStatus.DRAFT) throw new BadRequestException('Only draft surveys can be published');
    return this.prisma.survey.update({ where: { id }, data: { status: SurveyStatus.PUBLISHED, publishedAt: new Date() } });
  }
  async close(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.survey.update({ where: { id }, data: { status: SurveyStatus.CLOSED } });
  }
  async assignToUsers(surveyId: string, tenantId: string, userIds: string[]) {
    await this.findOne(surveyId, tenantId);
    return this.prisma.surveyAssignment.createMany({ data: userIds.map((userId) => ({ surveyId, userId })), skipDuplicates: true });
  }
  async submitResponse(surveyId: string, tenantId: string, userId: string | null, answers: any[]) {
    const survey = await this.findOne(surveyId, tenantId);
    if (survey.status !== SurveyStatus.PUBLISHED) throw new BadRequestException('Survey is not accepting responses');
    const response = await this.prisma.surveyResponse.create({
      data: { surveyId, userId: survey.isAnonymous ? null : userId, answers: { create: answers.map((a: any) => ({ questionId: a.questionId, numericValue: a.numericValue, textValue: a.textValue })) } },
      include: { answers: true },
    });
    if (userId) { await this.prisma.surveyAssignment.updateMany({ where: { surveyId, userId }, data: { status: 'COMPLETED', completedAt: new Date() } }); }
    return response;
  }
  async getResponses(surveyId: string, tenantId: string) {
    await this.findOne(surveyId, tenantId);
    return this.prisma.surveyResponse.findMany({ where: { surveyId }, include: { answers: { include: { question: true } } }, orderBy: { createdAt: 'desc' } });
  }
  async getCompletionRate(surveyId: string, tenantId: string) {
    await this.findOne(surveyId, tenantId);
    const [total, completed] = await Promise.all([this.prisma.surveyAssignment.count({ where: { surveyId } }), this.prisma.surveyAssignment.count({ where: { surveyId, status: 'COMPLETED' } })]);
    return { total, completed, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }
}
