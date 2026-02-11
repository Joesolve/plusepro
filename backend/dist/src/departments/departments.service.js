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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DepartmentsService = class DepartmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, name) {
        return this.prisma.department.create({ data: { tenantId, name } });
    }
    async findAll(tenantId) {
        return this.prisma.department.findMany({
            where: { tenantId },
            include: { teams: true, _count: { select: { users: true } } },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id, tenantId) {
        const dept = await this.prisma.department.findFirst({
            where: { id, tenantId },
            include: { teams: true, users: true },
        });
        if (!dept)
            throw new common_1.NotFoundException('Department not found');
        return dept;
    }
    async update(id, tenantId, name) {
        await this.findOne(id, tenantId);
        return this.prisma.department.update({ where: { id }, data: { name } });
    }
    async remove(id, tenantId) {
        await this.findOne(id, tenantId);
        return this.prisma.department.delete({ where: { id } });
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map