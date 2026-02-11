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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationsService = class NotificationsService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async create(data) {
        const n = await this.prisma.notification.create({ data: { tenantId: data.tenantId, userId: data.userId, type: data.type, title: data.title, body: data.body, link: data.link } });
        if (data.sendEmail)
            await this.sendEmail(data.userId, data.title, data.body);
        return n;
    }
    async getUnreadCount(userId) { return this.prisma.notification.count({ where: { userId, isRead: false } }); }
    async findAll(userId, limit = 20) { return this.prisma.notification.findMany({ where: { userId }, take: limit, orderBy: { createdAt: 'desc' } }); }
    async markAsRead(id, userId) { return this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } }); }
    async markAllAsRead(userId) { return this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } }); }
    async sendEmail(userId, subject, body) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
        if (!user)
            return;
        const apiKey = this.config.get('SENDGRID_API_KEY');
        if (!apiKey || apiKey.startsWith('SG.your'))
            return;
        try {
            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(apiKey);
            await sgMail.send({ to: user.email, from: this.config.get('SENDGRID_FROM_EMAIL'), subject: 'PulsePro: ' + subject, html: '<p>Hi ' + user.firstName + ',</p><p>' + body + '</p><p>— PulsePro Team</p>' });
        }
        catch (e) {
            console.error('SendGrid email failed:', e);
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map