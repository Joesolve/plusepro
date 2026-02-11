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
exports.RecognitionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RecognitionsService = class RecognitionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, senderId, data) {
        return this.prisma.recognition.create({ data: { tenantId, senderId, ...data }, include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }, receiver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }, coreValue: { select: { id: true, name: true } } } });
    }
    async getFeed(tenantId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = { tenantId, isPublic: true };
        const [recs, total] = await Promise.all([this.prisma.recognition.findMany({ where, skip, take: limit, include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }, receiver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }, coreValue: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } }), this.prisma.recognition.count({ where })]);
        return { data: recs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
    async getUserStats(tenantId, userId) {
        const stats = await this.prisma.recognition.groupBy({ by: ['coreValueId'], where: { tenantId, receiverId: userId }, _count: { id: true } });
        const cvs = await this.prisma.coreValue.findMany({ where: { tenantId } });
        const m = new Map(cvs.map((c) => [c.id, c.name]));
        return stats.map((s) => ({ coreValueId: s.coreValueId, coreValueName: m.get(s.coreValueId) || 'Unknown', count: s._count.id }));
    }
    async getActivityByCoreValue(tenantId) {
        const stats = await this.prisma.recognition.groupBy({ by: ['coreValueId'], where: { tenantId }, _count: { id: true } });
        const cvs = await this.prisma.coreValue.findMany({ where: { tenantId } });
        const m = new Map(cvs.map((c) => [c.id, c.name]));
        return stats.map((s) => ({ coreValueId: s.coreValueId, coreValueName: m.get(s.coreValueId) || 'Unknown', count: s._count.id }));
    }
};
exports.RecognitionsService = RecognitionsService;
exports.RecognitionsService = RecognitionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecognitionsService);
//# sourceMappingURL=recognitions.service.js.map