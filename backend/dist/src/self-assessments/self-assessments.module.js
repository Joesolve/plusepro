"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfAssessmentsModule = void 0;
const common_1 = require("@nestjs/common");
const self_assessments_service_1 = require("./self-assessments.service");
const self_assessments_controller_1 = require("./self-assessments.controller");
let SelfAssessmentsModule = class SelfAssessmentsModule {
};
exports.SelfAssessmentsModule = SelfAssessmentsModule;
exports.SelfAssessmentsModule = SelfAssessmentsModule = __decorate([
    (0, common_1.Module)({ controllers: [self_assessments_controller_1.SelfAssessmentsController], providers: [self_assessments_service_1.SelfAssessmentsService], exports: [self_assessments_service_1.SelfAssessmentsService] })
], SelfAssessmentsModule);
//# sourceMappingURL=self-assessments.module.js.map