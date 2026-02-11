import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
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

  /**
   * Applies tenant-scoped filtering to prevent cross-tenant data leakage.
   * Use this helper in all tenant-scoped queries.
   */
  tenantScope(tenantId: string) {
    return { tenantId };
  }

  /**
   * GDPR: Hard-delete all user data (right to erasure).
   * Removes user and all associated records across all tables.
   */
  async eraseUserData(userId: string): Promise<void> {
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
}
