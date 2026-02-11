"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecognitionsModule = void 0;
const common_1 = require("@nestjs/common");
const recognitions_service_1 = require("./recognitions.service");
const recognitions_controller_1 = require("./recognitions.controller");
let RecognitionsModule = class RecognitionsModule {
};
exports.RecognitionsModule = RecognitionsModule;
exports.RecognitionsModule = RecognitionsModule = __decorate([
    (0, common_1.Module)({ controllers: [recognitions_controller_1.RecognitionsController], providers: [recognitions_service_1.RecognitionsService], exports: [recognitions_service_1.RecognitionsService] })
], RecognitionsModule);
//# sourceMappingURL=recognitions.module.js.map