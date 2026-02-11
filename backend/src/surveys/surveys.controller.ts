import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SurveysService } from './surveys.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
@Controller('surveys')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SurveysController {
  constructor(private surveysService: SurveysService) {}
  @Post() @Roles(Role.COMPANY_ADMIN)
  create(@TenantId() tenantId: string, @CurrentUser('id') userId: string, @Body() dto: any) { return this.surveysService.create(tenantId, userId, dto); }
  @Get()
  findAll(@TenantId() tenantId: string, @Query('page') page?: number, @Query('limit') limit?: number) { return this.surveysService.findAll(tenantId, page, limit); }
  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) { return this.surveysService.findOne(id, tenantId); }
  @Patch(':id') @Roles(Role.COMPANY_ADMIN)
  update(@Param('id') id: string, @TenantId() tenantId: string, @Body() dto: any) { return this.surveysService.update(id, tenantId, dto); }
  @Post(':id/publish') @Roles(Role.COMPANY_ADMIN) @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string, @TenantId() tenantId: string) { return this.surveysService.publish(id, tenantId); }
  @Post(':id/close') @Roles(Role.COMPANY_ADMIN) @HttpCode(HttpStatus.OK)
  close(@Param('id') id: string, @TenantId() tenantId: string) { return this.surveysService.close(id, tenantId); }
  @Post(':id/assign') @Roles(Role.COMPANY_ADMIN)
  assign(@Param('id') id: string, @TenantId() tenantId: string, @Body('userIds') userIds: string[]) { return this.surveysService.assignToUsers(id, tenantId, userIds); }
  @Post(':id/respond')
  respond(@Param('id') id: string, @TenantId() tenantId: string, @CurrentUser('id') userId: string, @Body('answers') answers: any[]) { return this.surveysService.submitResponse(id, tenantId, userId, answers); }
  @Get(':id/responses') @Roles(Role.COMPANY_ADMIN, Role.MANAGER)
  getResponses(@Param('id') id: string, @TenantId() tenantId: string) { return this.surveysService.getResponses(id, tenantId); }
  @Get(':id/completion-rate') @Roles(Role.COMPANY_ADMIN, Role.MANAGER)
  getCompletionRate(@Param('id') id: string, @TenantId() tenantId: string) { return this.surveysService.getCompletionRate(id, tenantId); }
}
