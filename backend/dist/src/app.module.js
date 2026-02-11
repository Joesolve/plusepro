"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const tenants_module_1 = require("./tenants/tenants.module");
const users_module_1 = require("./users/users.module");
const departments_module_1 = require("./departments/departments.module");
const teams_module_1 = require("./teams/teams.module");
const surveys_module_1 = require("./surveys/surveys.module");
const self_assessments_module_1 = require("./self-assessments/self-assessments.module");
const suggestions_module_1 = require("./suggestions/suggestions.module");
const recognitions_module_1 = require("./recognitions/recognitions.module");
const analytics_module_1 = require("./analytics/analytics.module");
const notifications_module_1 = require("./notifications/notifications.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const onboarding_module_1 = require("./onboarding/onboarding.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            tenants_module_1.TenantsModule,
            users_module_1.UsersModule,
            departments_module_1.DepartmentsModule,
            teams_module_1.TeamsModule,
            surveys_module_1.SurveysModule,
            self_assessments_module_1.SelfAssessmentsModule,
            suggestions_module_1.SuggestionsModule,
            recognitions_module_1.RecognitionsModule,
            analytics_module_1.AnalyticsModule,
            notifications_module_1.NotificationsModule,
            subscriptions_module_1.SubscriptionsModule,
            onboarding_module_1.OnboardingModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map