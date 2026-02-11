import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}
  async create(tenantId: string, data: { name: string; departmentId: string; managerId?: string }) {
    return this.prisma.team.create({ data: { tenantId, ...data } });
  }
  async findAll(tenantId: string) {
    return this.prisma.team.findMany({ where: { tenantId }, include: { department: { select: { id: true, name: true } }, manager: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { members: true } } }, orderBy: { name: 'asc' } });
  }
  async findOne(id: string, tenantId: string) {
    const team = await this.prisma.team.findFirst({ where: { id, tenantId }, include: { department: true, manager: { select: { id: true, firstName: true, lastName: true, email: true } }, members: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } } });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }
  async update(id: string, tenantId: string, data: { name?: string; managerId?: string }) {
    await this.findOne(id, tenantId);
    return this.prisma.team.update({ where: { id }, data });
  }
  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.team.delete({ where: { id } });
  }
}
