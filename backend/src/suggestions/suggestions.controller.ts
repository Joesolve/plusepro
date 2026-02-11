import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SuggestionsService } from './suggestions.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Role, SuggestionStatus } from '@prisma/client';
@Controller('suggestions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SuggestionsController {
  constructor(private service: SuggestionsService) {}
  @Post() create(@TenantId() tenantId: string, @Body('text') text: string) { return this.service.create(tenantId, text); }
  @Get() @Roles(Role.COMPANY_ADMIN, Role.MANAGER) findAll(@TenantId() tenantId: string, @Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: SuggestionStatus) { return this.service.findAll(tenantId, page, limit, status); }
  @Patch(':id/status') @Roles(Role.COMPANY_ADMIN) updateStatus(@Param('id') id: string, @TenantId() tenantId: string, @Body() body: { status: SuggestionStatus; adminNote?: string }) { return this.service.updateStatus(id, tenantId, body.status, body.adminNote); }
  @Patch(':id/tags') @Roles(Role.COMPANY_ADMIN) updateTags(@Param('id') id: string, @TenantId() tenantId: string, @Body() body: { tags: string[]; category?: string }) { return this.service.updateTags(id, tenantId, body.tags, body.category); }
  @Get('keywords') @Roles(Role.COMPANY_ADMIN, Role.MANAGER) getKeywords(@TenantId() tenantId: string) { return this.service.getKeywordFrequency(tenantId); }
}
