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
exports.RecognitionsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const recognitions_service_1 = require("./recognitions.service");
const roles_guard_1 = require("../common/guards/roles.guard");
const tenant_decorator_1 = require("../common/decorators/tenant.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let RecognitionsController = class RecognitionsController {
    constructor(service) {
        this.service = service;
    }
    create(tenantId, senderId, data) { return this.service.create(tenantId, senderId, data); }
    getFeed(tenantId, page, limit) { return this.service.getFeed(tenantId, page, limit); }
    getUserStats(tenantId, userId) { return this.service.getUserStats(tenantId, userId); }
    getByValue(tenantId) { return this.service.getActivityByCoreValue(tenantId); }
};
exports.RecognitionsController = RecognitionsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_decorator_1.TenantId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RecognitionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('feed'),
    __param(0, (0, tenant_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], RecognitionsController.prototype, "getFeed", null);
__decorate([
    (0, common_1.Get)('stats/:userId'),
    __param(0, (0, tenant_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RecognitionsController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('by-value'),
    __param(0, (0, tenant_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RecognitionsController.prototype, "getByValue", null);
exports.RecognitionsController = RecognitionsController = __decorate([
    (0, common_1.Controller)('recognitions'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [recognitions_service_1.RecognitionsService])
], RecognitionsController);
//# sourceMappingURL=recognitions.controller.js.map