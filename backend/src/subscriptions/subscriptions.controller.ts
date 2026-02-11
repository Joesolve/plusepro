import { Controller, Post, Get, Body, Headers, Req, UseGuards, RawBodyRequest } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Role } from '@prisma/client';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private service: SubscriptionsService) {}

  @Post('checkout')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.COMPANY_ADMIN)
  createCheckout(@TenantId() tenantId: string, @Body('plan') plan: string) {
    return this.service.createCheckoutSession(tenantId, plan);
  }

  @Post('webhook')
  handleWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {
    return this.service.handleWebhook(req.rawBody as Buffer, signature);
  }

  @Post('cancel')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.COMPANY_ADMIN)
  cancel(@TenantId() tenantId: string) {
    return this.service.cancelSubscription(tenantId);
  }

  @Get('current')
  @UseGuards(AuthGuard('jwt'))
  getCurrent(@TenantId() tenantId: string) {
    return this.service.getSubscription(tenantId);
  }

  @Get('billing-overview')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  getBillingOverview() {
    return this.service.getBillingOverview();
  }
}
