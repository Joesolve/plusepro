import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RecognitionsService } from './recognitions.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
@Controller('recognitions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RecognitionsController {
  constructor(private service: RecognitionsService) {}
  @Post() create(@TenantId() tenantId: string, @CurrentUser('id') senderId: string, @Body() data: { receiverId: string; coreValueId: string; message: string }) { return this.service.create(tenantId, senderId, data); }
  @Get('feed') getFeed(@TenantId() tenantId: string, @Query('page') page?: number, @Query('limit') limit?: number) { return this.service.getFeed(tenantId, page, limit); }
  @Get('stats/:userId') getUserStats(@TenantId() tenantId: string, @Param('userId') userId: string) { return this.service.getUserStats(tenantId, userId); }
  @Get('by-value') getByValue(@TenantId() tenantId: string) { return this.service.getActivityByCoreValue(tenantId); }
}
