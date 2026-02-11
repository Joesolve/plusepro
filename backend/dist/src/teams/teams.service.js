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
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TeamsService = class TeamsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, data) {
        return this.prisma.team.create({ data: { tenantId, ...data } });
    }
    async findAll(tenantId) {
        return this.prisma.team.findMany({ where: { tenantId }, include: { department: { select: { id: true, name: true } }, manager: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { members: true } } }, orderBy: { name: 'asc' } });
    }
    async findOne(id, tenantId) {
        const team = await this.prisma.team.findFirst({ where: { id, tenantId }, include: { department: true, manager: { select: { id: true, firstName: true, lastName: true, email: true } }, members: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } } });
        if (!team)
            throw new common_1.NotFoundException('Team not found');
        return team;
    }
    async update(id, tenantId, data) {
        await this.findOne(id, tenantId);
        return this.prisma.team.update({ where: { id }, data });
    }
    async remove(id, tenantId) {
        await this.findOne(id, tenantId);
        return this.prisma.team.delete({ where: { id } });
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map