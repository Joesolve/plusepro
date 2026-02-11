import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TeamsService } from './teams.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Role } from '@prisma/client';
@Controller('teams')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}
  @Post() @Roles(Role.COMPANY_ADMIN)
  create(@TenantId() tenantId: string, @Body() data: { name: string; departmentId: string; managerId?: string }) { return this.teamsService.create(tenantId, data); }
  @Get()
  findAll(@TenantId() tenantId: string) { return this.teamsService.findAll(tenantId); }
  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) { return this.teamsService.findOne(id, tenantId); }
  @Patch(':id') @Roles(Role.COMPANY_ADMIN)
  update(@Param('id') id: string, @TenantId() tenantId: string, @Body() data: { name?: string; managerId?: string }) { return this.teamsService.update(id, tenantId, data); }
  @Delete(':id') @Roles(Role.COMPANY_ADMIN)
  remove(@Param('id') id: string, @TenantId() tenantId: string) { return this.teamsService.remove(id, tenantId); }
}
