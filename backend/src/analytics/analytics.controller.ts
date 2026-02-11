import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Role } from '@prisma/client';
@Controller('analytics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.COMPANY_ADMIN, Role.MANAGER)
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}
  @Get('engagement-trend') getEngagementTrend(@TenantId() tenantId: string, @Query('months') months?: number) { return this.service.getEngagementTrend(tenantId, months || 12); }
  @Get('department-heatmap') getDepartmentHeatmap(@TenantId() tenantId: string) { return this.service.getDepartmentHeatmap(tenantId); }
  @Get('completion-rates') getCompletionRates(@TenantId() tenantId: string) { return this.service.getSurveyCompletionRates(tenantId); }
  @Get('top-bottom-questions') getTopBottomQuestions(@TenantId() tenantId: string, @Query('limit') limit?: number) { return this.service.getTopBottomQuestions(tenantId, limit || 5); }
  @Get('gap-trends') getGapTrends(@TenantId() tenantId: string) { return this.service.getGapTrends(tenantId); }
}
