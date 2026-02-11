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
exports.SuggestionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SuggestionsService = class SuggestionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, text, userId) { return this.prisma.suggestion.create({ data: { tenantId, text, userId } }); }
    async findAll(tenantId, page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (status)
            where.status = status;
        const [suggestions, total] = await Promise.all([this.prisma.suggestion.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }), this.prisma.suggestion.count({ where })]);
        return { data: suggestions, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
    async updateStatus(id, tenantId, status, adminNote) {
        const s = await this.prisma.suggestion.findFirst({ where: { id, tenantId } });
        if (!s)
            throw new common_1.NotFoundException('Suggestion not found');
        return this.prisma.suggestion.update({ where: { id }, data: { status, adminNote } });
    }
    async updateTags(id, tenantId, tags, category) {
        const s = await this.prisma.suggestion.findFirst({ where: { id, tenantId } });
        if (!s)
            throw new common_1.NotFoundException('Suggestion not found');
        return this.prisma.suggestion.update({ where: { id }, data: { tags, category } });
    }
    async getKeywordFrequency(tenantId) {
        const suggestions = await this.prisma.suggestion.findMany({ where: { tenantId }, select: { text: true } });
        const stops = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'and', 'but', 'or', 'not', 'no', 'so', 'yet', 'if', 'when', 'where', 'how', 'what', 'which', 'who', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'about', 'also', 'up', 'out', 'then', 'there', 'than', 'too', 'very', 'just']);
        const counts = {};
        for (const s of suggestions) {
            for (const w of s.text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)) {
                if (w.length > 2 && !stops.has(w))
                    counts[w] = (counts[w] || 0) + 1;
            }
        }
        return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 30).map(([word, count]) => ({ word, count }));
    }
};
exports.SuggestionsService = SuggestionsService;
exports.SuggestionsService = SuggestionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuggestionsService);
//# sourceMappingURL=suggestions.service.js.map