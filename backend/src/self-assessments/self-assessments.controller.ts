import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SelfAssessmentsService } from './self-assessments.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, AssessmentType } from '@prisma/client';
@Controller('self-assessments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SelfAssessmentsController {
  constructor(private service: SelfAssessmentsService) {}
  @Post('cycles') @Roles(Role.COMPANY_ADMIN)
  createCycle(@TenantId() tenantId: string, @Body() data: { name: string; startDate: Date; endDate: Date }) { return this.service.createCycle(tenantId, data); }
  @Get('cycles')
  getCycles(@TenantId() tenantId: string) { return this.service.getActiveCycles(tenantId); }
  @Post()
  submit(@TenantId() tenantId: string, @CurrentUser('id') userId: string, @Body() data: { cycleId: string; employeeId: string; coreValueId: string; rating: number; comment?: string; assessmentType: AssessmentType }) {
    return this.service.submitAssessment(tenantId, { ...data, assessorId: userId });
  }
  @Get('gap-analysis/:cycleId/:employeeId') @Roles(Role.COMPANY_ADMIN, Role.MANAGER, Role.EMPLOYEE)
  getGapAnalysis(@TenantId() tenantId: string, @Param('cycleId') cycleId: string, @Param('employeeId') employeeId: string) { return this.service.getGapAnalysis(tenantId, cycleId, employeeId); }
}
