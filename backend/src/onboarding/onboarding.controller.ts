import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OnboardingService } from './onboarding.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Role } from '@prisma/client';

@Controller('onboarding')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.COMPANY_ADMIN)
export class OnboardingController {
  constructor(private service: OnboardingService) {}

  @Post('core-values')
  setCoreValues(@TenantId() tenantId: string, @Body('values') values: { name: string; description?: string }[]) {
    return this.service.setCoreValues(tenantId, values);
  }

  @Post('employees')
  uploadEmployees(@TenantId() tenantId: string, @Body('employees') employees: { email: string; firstName: string; lastName: string; role?: string; departmentName?: string }[]) {
    return this.service.uploadEmployees(tenantId, employees);
  }

  @Get('status')
  getStatus(@TenantId() tenantId: string) {
    return this.service.getOnboardingStatus(tenantId);
  }
}
