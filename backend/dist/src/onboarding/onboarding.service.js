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
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
let OnboardingService = class OnboardingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async setCoreValues(tenantId, values) {
        if (!values.length)
            throw new common_1.BadRequestException('At least one core value is required');
        const existing = await this.prisma.coreValue.findMany({ where: { tenantId } });
        const existingNames = new Set(existing.map((v) => v.name.toLowerCase()));
        const toCreate = values.filter((v) => !existingNames.has(v.name.toLowerCase()));
        if (toCreate.length > 0) {
            await this.prisma.coreValue.createMany({
                data: toCreate.map((v) => ({ tenantId, name: v.name, description: v.description || '' })),
            });
        }
        return this.prisma.coreValue.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
    }
    async uploadEmployees(tenantId, employees) {
        if (!employees.length)
            throw new common_1.BadRequestException('No employees provided');
        const results = { created: 0, skipped: 0, errors: [] };
        const defaultPassword = await bcrypt.hash('ChangeMeNow!1', 12);
        for (const emp of employees) {
            try {
                const existingUser = await this.prisma.user.findUnique({ where: { email: emp.email } });
                if (existingUser) {
                    results.skipped++;
                    continue;
                }
                let departmentId;
                if (emp.departmentName) {
                    let dept = await this.prisma.department.findFirst({ where: { tenantId, name: emp.departmentName } });
                    if (!dept) {
                        dept = await this.prisma.department.create({ data: { tenantId, name: emp.departmentName } });
                    }
                    departmentId = dept.id;
                }
                await this.prisma.user.create({
                    data: {
                        tenantId,
                        email: emp.email,
                        passwordHash: defaultPassword,
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        role: emp.role || 'EMPLOYEE',
                        departmentId,
                    },
                });
                results.created++;
            }
            catch (e) {
                results.errors.push(`Failed to create ${emp.email}: ${e.message}`);
            }
        }
        return results;
    }
    async getOnboardingStatus(tenantId) {
        const [coreValues, users, surveys, departments] = await Promise.all([
            this.prisma.coreValue.count({ where: { tenantId } }),
            this.prisma.user.count({ where: { tenantId } }),
            this.prisma.survey.count({ where: { tenantId } }),
            this.prisma.department.count({ where: { tenantId } }),
        ]);
        const steps = [
            { key: 'core_values', label: 'Define Core Values', completed: coreValues > 0 },
            { key: 'employees', label: 'Add Employees', completed: users > 1 },
            { key: 'departments', label: 'Set Up Departments', completed: departments > 0 },
            { key: 'first_survey', label: 'Create First Survey', completed: surveys > 0 },
        ];
        return {
            steps,
            completedCount: steps.filter((s) => s.completed).length,
            totalSteps: steps.length,
            isComplete: steps.every((s) => s.completed),
        };
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OnboardingService);
//# sourceMappingURL=onboarding.service.js.map