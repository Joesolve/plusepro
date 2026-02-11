import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}
  async create(data: { tenantId: string; userId: string; type: NotificationType; title: string; body: string; link?: string; sendEmail?: boolean }) {
    const n = await this.prisma.notification.create({ data: { tenantId: data.tenantId, userId: data.userId, type: data.type, title: data.title, body: data.body, link: data.link } });
    if (data.sendEmail) await this.sendEmail(data.userId, data.title, data.body);
    return n;
  }
  async getUnreadCount(userId: string) { return this.prisma.notification.count({ where: { userId, isRead: false } }); }
  async findAll(userId: string, limit = 20) { return this.prisma.notification.findMany({ where: { userId }, take: limit, orderBy: { createdAt: 'desc' } }); }
  async markAsRead(id: string, userId: string) { return this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } }); }
  async markAllAsRead(userId: string) { return this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } }); }
  private async sendEmail(userId: string, subject: string, body: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
    if (!user) return;
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    if (!apiKey || apiKey.startsWith('SG.your')) return;
    try { const sgMail = require('@sendgrid/mail'); sgMail.setApiKey(apiKey); await sgMail.send({ to: user.email, from: this.config.get<string>('SENDGRID_FROM_EMAIL'), subject: 'PulsePro: ' + subject, html: '<p>Hi ' + user.firstName + ',</p><p>' + body + '</p><p>— PulsePro Team</p>' }); } catch (e) { console.error('SendGrid email failed:', e); }
  }
}
