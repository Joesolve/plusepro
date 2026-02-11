import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail },
    });
    if (existingUser) {
      throw new ConflictException('Admin email already registered');
    }

    // Check if slug already exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });
    if (existingTenant) {
      throw new ConflictException('Tenant slug already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);

    // Create tenant with subscription and admin user
    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        domain: dto.domain,
        logoUrl: dto.logoUrl,
        // Create default subscription
        subscription: {
          create: { plan: 'STARTER', maxEmployees: 25 },
        },
        // Create admin user
        users: {
          create: {
            email: dto.adminEmail,
            firstName: dto.adminFirstName,
            lastName: dto.adminLastName,
            passwordHash,
            role: 'COMPANY_ADMIN',
            isActive: true,
            emailVerified: new Date(),
          },
        },
      },
      include: {
        subscription: true,
        _count: { select: { users: true } },
      },
    });
    return tenant;
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      include: {
        subscription: true,
        _count: { select: { users: true } },
      },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: true,
        departments: true,
        coreValues: true,
        _count: { select: { users: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: { subscription: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.tenant.delete({ where: { id } });
  }
}
