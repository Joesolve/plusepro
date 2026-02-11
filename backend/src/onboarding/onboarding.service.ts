import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async setCoreValues(tenantId: string, values: { name: string; description?: string }[]) {
    if (!values.length) throw new BadRequestException('At least one core value is required');

    const existing = await this.prisma.coreValue.findMany({ where: { tenantId } });
    const existingNames = new Set(existing.map((v) => v.name.toLowerCase()));

    const toCreate = values.filter((v) => !existingNames.has(v.name.toLowerCase()));
    if (toCreate.length > 0) {
      await this.prisma.coreValue.createMany({
        data: toCreate.map((v) => ({ tenantId, name: v.name, description: v.description || '' })),
      });
    }

    return this.prisma.coreValue.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async uploadEmployees(tenantId: string, employees: { email: string; firstName: string; lastName: string; role?: string; departmentName?: string }[]) {
    if (!employees.length) throw new BadRequestException('No employees provided');

    const results = { created: 0, skipped: 0, errors: [] as string[] };
    const defaultPassword = await bcrypt.hash('ChangeMeNow!1', 12);

    for (const emp of employees) {
      try {
        const existingUser = await this.prisma.user.findUnique({ where: { email: emp.email } });
        if (existingUser) {
          results.skipped++;
          continue;
        }

        let departmentId: string | undefined;
        if (emp.departmentName) {
          let dept = await this.prisma.department.findFirst({ where: { tenantId, name: emp.departmentName } });
          if (!dept) {
            dept = await this.prisma.department.create({ data: { tenantId, name: emp.departmentName } });
          }
          departmentId = dept.id;
        }

        await this.prisma.user.create({
          data: {
            tenantId,
            email: emp.email,
            passwordHash: defaultPassword,
            firstName: emp.firstName,
            lastName: emp.lastName,
            role: (emp.role as any) || 'EMPLOYEE',
            departmentId,
          },
        });
        results.created++;
      } catch (e: any) {
        results.errors.push(`Failed to create ${emp.email}: ${e.message}`);
      }
    }

    return results;
  }

  async getOnboardingStatus(tenantId: string) {
    const [coreValues, users, surveys, departments] = await Promise.all([
      this.prisma.coreValue.count({ where: { tenantId } }),
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.survey.count({ where: { tenantId } }),
      this.prisma.department.count({ where: { tenantId } }),
    ]);

    const steps = [
      { key: 'core_values', label: 'Define Core Values', completed: coreValues > 0 },
      { key: 'employees', label: 'Add Employees', completed: users > 1 },
      { key: 'departments', label: 'Set Up Departments', completed: departments > 0 },
      { key: 'first_survey', label: 'Create First Survey', completed: surveys > 0 },
    ];

    return {
      steps,
      completedCount: steps.filter((s) => s.completed).length,
      totalSteps: steps.length,
      isComplete: steps.every((s) => s.completed),
    };
  }
}
