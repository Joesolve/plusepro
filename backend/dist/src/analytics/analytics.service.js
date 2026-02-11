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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getEngagementTrend(tenantId, months = 12) {
        const start = new Date();
        start.setMonth(start.getMonth() - months);
        const responses = await this.prisma.surveyResponse.findMany({ where: { survey: { tenantId }, createdAt: { gte: start } }, include: { answers: { where: { numericValue: { not: null } } } }, orderBy: { createdAt: 'asc' } });
        const monthly = {};
        for (const r of responses) {
            const key = r.createdAt.toISOString().slice(0, 7);
            if (!monthly[key])
                monthly[key] = { total: 0, count: 0 };
            for (const a of r.answers) {
                if (a.numericValue !== null) {
                    monthly[key].total += a.numericValue;
                    monthly[key].count++;
                }
            }
        }
        return Object.entries(monthly).map(([month, d]) => ({ month, averageScore: d.count > 0 ? +(d.total / d.count).toFixed(2) : 0, responseCount: d.count }));
    }
    async getDepartmentHeatmap(tenantId) {
        const depts = await this.prisma.department.findMany({ where: { tenantId }, include: { users: { select: { id: true } } } });
        const results = [];
        for (const dept of depts) {
            const uids = dept.users.map((u) => u.id);
            if (!uids.length)
                continue;
            const answers = await this.prisma.surveyAnswer.findMany({ where: { numericValue: { not: null }, response: { userId: { in: uids }, survey: { tenantId } } }, include: { question: { include: { coreValue: true } } } });
            const scores = {};
            for (const a of answers) {
                const vn = a.question.coreValue?.name || 'General';
                if (!scores[vn])
                    scores[vn] = { total: 0, count: 0 };
                scores[vn].total += a.numericValue;
                scores[vn].count++;
            }
            results.push({ departmentId: dept.id, departmentName: dept.name, scores: Object.entries(scores).map(([value, d]) => ({ value, average: d.count > 0 ? +(d.total / d.count).toFixed(2) : 0 })) });
        }
        return results;
    }
    async getSurveyCompletionRates(tenantId) {
        const surveys = await this.prisma.survey.findMany({ where: { tenantId, status: { not: 'DRAFT' } }, select: { id: true, title: true, publishedAt: true, _count: { select: { assignments: true, responses: true } } }, orderBy: { publishedAt: 'desc' } });
        return surveys.map((s) => ({ surveyId: s.id, title: s.title, publishedAt: s.publishedAt, assignedCount: s._count.assignments, responseCount: s._count.responses, completionRate: s._count.assignments > 0 ? Math.round((s._count.responses / s._count.assignments) * 100) : 0 }));
    }
    async getTopBottomQuestions(tenantId, limit = 5) {
        const questions = await this.prisma.surveyQuestion.findMany({ where: { survey: { tenantId }, type: { in: ['LIKERT_SCALE', 'YES_NO'] } }, include: { answers: { where: { numericValue: { not: null } } }, survey: { select: { title: true } } } });
        const scored = questions.map((q) => { const avg = q.answers.length > 0 ? q.answers.reduce((s, a) => s + (a.numericValue || 0), 0) / q.answers.length : 0; return { questionId: q.id, text: q.text, surveyTitle: q.survey.title, averageScore: +avg.toFixed(2), responseCount: q.answers.length }; }).filter((q) => q.responseCount > 0).sort((a, b) => b.averageScore - a.averageScore);
        return { top: scored.slice(0, limit), bottom: scored.slice(-limit).reverse() };
    }
    async getGapTrends(tenantId) {
        const cycles = await this.prisma.assessmentCycle.findMany({ where: { tenantId }, include: { selfAssessments: { include: { coreValue: true } } }, orderBy: { startDate: 'asc' } });
        return cycles.map((cycle) => {
            const gaps = {};
            for (const a of cycle.selfAssessments) {
                const vn = a.coreValue.name;
                if (!gaps[vn])
                    gaps[vn] = { st: 0, sc: 0, mt: 0, mc: 0 };
                if (a.assessmentType === 'SELF') {
                    gaps[vn].st += a.rating;
                    gaps[vn].sc++;
                }
                else {
                    gaps[vn].mt += a.rating;
                    gaps[vn].mc++;
                }
            }
            return { cycleId: cycle.id, cycleName: cycle.name, startDate: cycle.startDate, gaps: Object.entries(gaps).map(([value, d]) => ({ value, avgSelfRating: d.sc > 0 ? +(d.st / d.sc).toFixed(2) : 0, avgManagerRating: d.mc > 0 ? +(d.mt / d.mc).toFixed(2) : 0, avgGap: d.sc > 0 && d.mc > 0 ? +((d.st / d.sc) - (d.mt / d.mc)).toFixed(2) : 0 })) };
        });
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map