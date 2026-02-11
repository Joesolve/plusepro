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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const pagination_1 = require("../common/utils/pagination");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId, role, userId, pagination) {
        const { page = 1, limit = 20 } = pagination;
        const skip = (page - 1) * limit;
        let where = { tenantId, deletedAt: null };
        if (role === client_1.Role.MANAGER) {
            const managedTeams = await this.prisma.team.findMany({
                where: { managerId: userId },
                select: { id: true },
            });
            const teamIds = managedTeams.map((t) => t.id);
            where.teamId = { in: teamIds };
        }
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    role: true,
                    isActive: true,
                    department: { select: { id: true, name: true } },
                    team: { select: { id: true, name: true } },
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return (0, pagination_1.paginate)(users, total, page, limit);
    }
    async findOne(id, tenantId) {
        const user = await this.prisma.user.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: {
                department: true,
                team: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async update(id, tenantId, dto) {
        await this.findOne(id, tenantId);
        return this.prisma.user.update({
            where: { id },
            data: dto,
        });
    }
    async softDelete(id, tenantId) {
        await this.findOne(id, tenantId);
        return this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
    }
    async eraseUserData(id, tenantId) {
        const user = await this.prisma.user.findFirst({
            where: { id, tenantId },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.prisma.eraseUserData(id);
    }
    async bulkCreate(tenantId, users) {
        const created = await this.prisma.$transaction(users.map((u) => this.prisma.user.create({
            data: {
                ...u,
                tenantId,
                role: u.role || client_1.Role.EMPLOYEE,
            },
        })));
        return created;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map