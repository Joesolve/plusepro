import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, paginate } from '../common/utils/pagination';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * List users scoped to a tenant.
   * Managers only see users in their teams.
   */
  async findAll(
    tenantId: string,
    role: Role,
    userId: string,
    pagination: PaginationDto,
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    let where: any = { tenantId, deletedAt: null };

    // Managers can only see their team members
    if (role === Role.MANAGER) {
      const managedTeams = await this.prisma.team.findMany({
        where: { managerId: userId },
        select: { id: true },
      });
      const teamIds = managedTeams.map((t) => t.id);
      where.teamId = { in: teamIds };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          department: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(users, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        department: true,
        team: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, tenantId: string, dto: UpdateUserDto) {
    await this.findOne(id, tenantId);
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  /** Soft-delete user (GDPR-compatible) */
  async softDelete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  /** GDPR: Hard-delete all user data (right to erasure) */
  async eraseUserData(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.eraseUserData(id);
  }

  /** Bulk create users from CSV data */
  async bulkCreate(
    tenantId: string,
    users: Array<{
      email: string;
      firstName: string;
      lastName: string;
      role?: Role;
      departmentId?: string;
      teamId?: string;
    }>,
  ) {
    const created = await this.prisma.$transaction(
      users.map((u) =>
        this.prisma.user.create({
          data: {
            ...u,
            tenantId,
            role: u.role || Role.EMPLOYEE,
          },
        }),
      ),
    );
    return created;
  }
}
