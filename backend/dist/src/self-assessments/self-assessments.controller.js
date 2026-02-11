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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfAssessmentsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const self_assessments_service_1 = require("./self-assessments.service");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const tenant_decorator_1 = require("../common/decorators/tenant.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let SelfAssessmentsController = class SelfAssessmentsController {
    constructor(service) {
        this.service = service;
    }
    createCycle(tenantId, data) { return this.service.createCycle(tenantId, data); }
    getCycles(tenantId) { return this.service.getActiveCycles(tenantId); }
    submit(tenantId, userId, data) {
        return this.service.submitAssessment(tenantId, { ...data, assessorId: userId });
    }
    getGapAnalysis(tenantId, cycleId, employeeId) { return this.service.getGapAnalysis(tenantId, cycleId, employeeId); }
};
exports.SelfAssessmentsController = SelfAssessmentsController;
__decorate([
    (0, common_1.Post)('cycles'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN),
    __param(0, (0, tenant_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SelfAssessmentsController.prototype, "createCycle", null);
__decorate([
    (0, common_1.Get)('cycles'),
    __param(0, (0, tenant_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SelfAssessmentsController.prototype, "getCycles", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_decorator_1.TenantId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SelfAssessmentsController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)('gap-analysis/:cycleId/:employeeId'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN, client_1.Role.MANAGER, client_1.Role.EMPLOYEE),
    __param(0, (0, tenant_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('cycleId')),
    __param(2, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], SelfAssessmentsController.prototype, "getGapAnalysis", null);
exports.SelfAssessmentsController = SelfAssessmentsController = __decorate([
    (0, common_1.Controller)('self-assessments'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [self_assessments_service_1.SelfAssessmentsService])
], SelfAssessmentsController);
//# sourceMappingURL=self-assessments.controller.js.map