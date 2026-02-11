import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, name: string) {
    return this.prisma.department.create({ data: { tenantId, name } });
  }

  async findAll(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: { teams: true, _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const dept = await this.prisma.department.findFirst({
      where: { id, tenantId },
      include: { teams: true, users: true },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(id: string, tenantId: string, name: string) {
    await this.findOne(id, tenantId);
    return this.prisma.department.update({ where: { id }, data: { name } });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.department.delete({ where: { id } });
  }
}
