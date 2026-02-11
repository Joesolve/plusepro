"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveysService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SurveysService = class SurveysService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, createdById, dto) {
        const { questions, ...surveyData } = dto;
        return this.prisma.survey.create({
            data: { ...surveyData, tenantId, createdById, questions: { create: (questions || []).map((q, idx) => ({ text: q.text, type: q.type, isRequired: q.isRequired ?? true, sortOrder: q.sortOrder ?? idx, coreValueId: q.coreValueId, options: q.options })) } },
            include: { questions: { orderBy: { sortOrder: 'asc' } } },
        });
    }
    async findAll(tenantId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [surveys, total] = await Promise.all([
            this.prisma.survey.findMany({ where: { tenantId }, skip, take: limit, include: { _count: { select: { questions: true, responses: true, assignments: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.survey.count({ where: { tenantId } }),
        ]);
        return { data: surveys, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
    async findOne(id, tenantId) {
        const survey = await this.prisma.survey.findFirst({ where: { id, tenantId }, include: { questions: { orderBy: { sortOrder: 'asc' }, include: { coreValue: true } }, _count: { select: { responses: true, assignments: true } } } });
        if (!survey)
            throw new common_1.NotFoundException('Survey not found');
        return survey;
    }
    async update(id, tenantId, dto) {
        const survey = await this.findOne(id, tenantId);
        if (survey.status === client_1.SurveyStatus.CLOSED)
            throw new common_1.BadRequestException('Cannot edit a closed survey');
        const { questions, ...data } = dto;
        return this.prisma.survey.update({ where: { id }, data, include: { questions: true } });
    }
    async publish(id, tenantId) {
        const survey = await this.findOne(id, tenantId);
        if (survey.status !== client_1.SurveyStatus.DRAFT)
            throw new common_1.BadRequestException('Only draft surveys can be published');
        return this.prisma.survey.update({ where: { id }, data: { status: client_1.SurveyStatus.PUBLISHED, publishedAt: new Date() } });
    }
    async close(id, tenantId) {
        await this.findOne(id, tenantId);
        return this.prisma.survey.update({ where: { id }, data: { status: client_1.SurveyStatus.CLOSED } });
    }
    async assignToUsers(surveyId, tenantId, userIds) {
        await this.findOne(surveyId, tenantId);
        return this.prisma.surveyAssignment.createMany({ data: userIds.map((userId) => ({ surveyId, userId })), skipDuplicates: true });
    }
    async submitResponse(surveyId, tenantId, userId, answers) {
        const survey = await this.findOne(surveyId, tenantId);
        if (survey.status !== client_1.SurveyStatus.PUBLISHED)
            throw new common_1.BadRequestException('Survey is not accepting responses');
        const response = await this.prisma.surveyResponse.create({
            data: { surveyId, userId: survey.isAnonymous ? null : userId, answers: { create: answers.map((a) => ({ questionId: a.questionId, numericValue: a.numericValue, textValue: a.textValue })) } },
            include: { answers: true },
        });
        if (userId) {
            await this.prisma.surveyAssignment.updateMany({ where: { surveyId, userId }, data: { status: 'COMPLETED', completedAt: new Date() } });
        }
        return response;
    }
    async getResponses(surveyId, tenantId) {
        await this.findOne(surveyId, tenantId);
        return this.prisma.surveyResponse.findMany({ where: { surveyId }, include: { answers: { include: { question: true } } }, orderBy: { createdAt: 'desc' } });
    }
    async getCompletionRate(surveyId, tenantId) {
        await this.findOne(surveyId, tenantId);
        const [total, completed] = await Promise.all([this.prisma.surveyAssignment.count({ where: { surveyId } }), this.prisma.surveyAssignment.count({ where: { surveyId, status: 'COMPLETED' } })]);
        return { total, completed, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
    }
};
exports.SurveysService = SurveysService;
exports.SurveysService = SurveysService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SurveysService);
//# sourceMappingURL=surveys.service.js.map