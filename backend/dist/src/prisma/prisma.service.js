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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super({
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['error'],
        });
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    tenantScope(tenantId) {
        return { tenantId };
    }
    async eraseUserData(userId) {
        await this.$transaction([
            this.surveyAnswer.deleteMany({
                where: { response: { userId } },
            }),
            this.surveyResponse.deleteMany({ where: { userId } }),
            this.surveyAssignment.deleteMany({ where: { userId } }),
            this.selfAssessment.deleteMany({
                where: { OR: [{ employeeId: userId }, { assessorId: userId }] },
            }),
            this.suggestion.deleteMany({ where: { userId } }),
            this.recognition.deleteMany({
                where: { OR: [{ senderId: userId }, { receiverId: userId }] },
            }),
            this.notification.deleteMany({ where: { userId } }),
            this.account.deleteMany({ where: { userId } }),
            this.user.delete({ where: { id: userId } }),
        ]);
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map