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
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
let TenantsService = class TenantsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.adminEmail },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Admin email already registered');
        }
        const existingTenant = await this.prisma.tenant.findUnique({
            where: { slug: dto.slug },
        });
        if (existingTenant) {
            throw new common_1.ConflictException('Tenant slug already exists');
        }
        const passwordHash = await bcrypt.hash(dto.adminPassword, 12);
        const tenant = await this.prisma.tenant.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                domain: dto.domain,
                logoUrl: dto.logoUrl,
                subscription: {
                    create: { plan: 'STARTER', maxEmployees: 25 },
                },
                users: {
                    create: {
                        email: dto.adminEmail,
                        firstName: dto.adminFirstName,
                        lastName: dto.adminLastName,
                        passwordHash,
                        role: 'COMPANY_ADMIN',
                        isActive: true,
                        emailVerified: new Date(),
                    },
                },
            },
            include: {
                subscription: true,
                _count: { select: { users: true } },
            },
        });
        return tenant;
    }
    async findAll() {
        return this.prisma.tenant.findMany({
            include: {
                subscription: true,
                _count: { select: { users: true } },
            },
        });
    }
    async findOne(id) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                subscription: true,
                departments: true,
                coreValues: true,
                _count: { select: { users: true } },
            },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        return tenant;
    }
    async findBySlug(slug) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
            include: { subscription: true },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        return tenant;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.tenant.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.tenant.delete({ where: { id } });
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map