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
exports.SelfAssessmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SelfAssessmentsService = class SelfAssessmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCycle(tenantId, data) {
        return this.prisma.assessmentCycle.create({ data: { tenantId, ...data } });
    }
    async getActiveCycles(tenantId) {
        return this.prisma.assessmentCycle.findMany({ where: { tenantId, isActive: true }, orderBy: { startDate: 'desc' } });
    }
    async submitAssessment(tenantId, data) {
        return this.prisma.selfAssessment.upsert({
            where: { cycleId_employeeId_assessorId_coreValueId: { cycleId: data.cycleId, employeeId: data.employeeId, assessorId: data.assessorId, coreValueId: data.coreValueId } },
            update: { rating: data.rating, comment: data.comment },
            create: { tenantId, ...data },
        });
    }
    async getGapAnalysis(tenantId, cycleId, employeeId) {
        const assessments = await this.prisma.selfAssessment.findMany({ where: { tenantId, cycleId, employeeId }, include: { coreValue: true } });
        const valueMap = new Map();
        for (const a of assessments) {
            if (!valueMap.has(a.coreValueId))
                valueMap.set(a.coreValueId, { valueName: a.coreValue.name, selfRating: null, managerRating: null });
            const entry = valueMap.get(a.coreValueId);
            if (a.assessmentType === client_1.AssessmentType.SELF)
                entry.selfRating = a.rating;
            else
                entry.managerRating = a.rating;
        }
        return Array.from(valueMap.values()).map((v) => ({ ...v, gap: v.selfRating !== null && v.managerRating !== null ? v.selfRating - v.managerRating : null }));
    }
};
exports.SelfAssessmentsService = SelfAssessmentsService;
exports.SelfAssessmentsService = SelfAssessmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SelfAssessmentsService);
//# sourceMappingURL=self-assessments.service.js.map