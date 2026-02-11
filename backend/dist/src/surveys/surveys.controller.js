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
exports.SurveysController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const surveys_service_1 = require("./surveys.service");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const tenant_decorator_1 = require("../common/decorators/tenant.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let SurveysController = class SurveysController {
    constructor(surveysService) {
        this.surveysService = surveysService;
    }
    create(tenantId, userId, dto) { return this.surveysService.create(tenantId, userId, dto); }
    findAll(tenantId, page, limit) { return this.surveysService.findAll(tenantId, page, limit); }
    findOne(id, tenantId) { return this.surveysService.findOne(id, tenantId); }
    update(id, tenantId, dto) { return this.surveysService.update(id, tenantId, dto); }
    publish(id, tenantId) { return this.surveysService.publish(id, tenantId); }
    close(id, tenantId) { return this.surveysService.close(id, tenantId); }
    assign(id, tenantId, userIds) { return this.surveysService.assignToUsers(id, tenantId, userIds); }
    respond(id, tenantId, userId, answers) { return this.surveysService.submitResponse(id, tenantId, userId, answers); }
    getResponses(id, tenantId) { return this.surveysService.getResponses(id, tenantId); }
    getCompletionRate(id, tenantId) { return this.surveysService.getCompletionRate(id, tenantId); }
};
exports.SurveysController = SurveysController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN),
    __param(0, (0, tenant_decorator_1.TenantId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SurveysController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], SurveysController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SurveysController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_decorator_1.TenantId)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SurveysController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SurveysController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)(':id/close'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SurveysController.prototype, "close", null);
__decorate([
    (0, common_1.Post)(':id/assign'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_decorator_1.TenantId)()),
    __param(2, (0, common_1.Body)('userIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array]),
    __metadata("design:returntype", void 0)
], SurveysController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)(':id/respond'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_decorator_1.TenantId)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, common_1.Body)('answers')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Array]),
    __metadata("design:returntype", void 0)
], SurveysController.prototype, "respond", null);
__decorate([
    (0, common_1.Get)(':id/responses'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN, client_1.Role.MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SurveysController.prototype, "getResponses", null);
__decorate([
    (0, common_1.Get)(':id/completion-rate'),
    (0, roles_decorator_1.Roles)(client_1.Role.COMPANY_ADMIN, client_1.Role.MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SurveysController.prototype, "getCompletionRate", null);
exports.SurveysController = SurveysController = __decorate([
    (0, common_1.Controller)('surveys'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [surveys_service_1.SurveysService])
], SurveysController);
//# sourceMappingURL=surveys.controller.js.map