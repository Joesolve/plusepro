import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DepartmentsService } from './departments.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Role } from '@prisma/client';

@Controller('departments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Post()
  @Roles(Role.COMPANY_ADMIN)
  create(@TenantId() tenantId: string, @Body('name') name: string) {
    return this.departmentsService.create(tenantId, name);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.departmentsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.departmentsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Role.COMPANY_ADMIN)
  update(@Param('id') id: string, @TenantId() tenantId: string, @Body('name') name: string) {
    return this.departmentsService.update(id, tenantId, name);
  }

  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN)
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.departmentsService.remove(id, tenantId);
  }
}
