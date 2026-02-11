import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { PaginationDto } from '../common/utils/pagination';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard, TenantGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  /** GET /api/users — List users (tenant-scoped) */
  @Get()
  @Roles(Role.COMPANY_ADMIN, Role.MANAGER)
  findAll(
    @TenantId() tenantId: string,
    @CurrentUser('role') role: Role,
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.usersService.findAll(tenantId, role, userId, pagination);
  }

  /** GET /api/users/:id */
  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.usersService.findOne(id, tenantId);
  }

  /** PATCH /api/users/:id */
  @Patch(':id')
  @Roles(Role.COMPANY_ADMIN)
  update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, tenantId, dto);
  }

  /** DELETE /api/users/:id — Soft delete */
  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.usersService.softDelete(id, tenantId);
  }

  /** DELETE /api/users/:id/erase — GDPR hard delete */
  @Delete(':id/erase')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  erase(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.usersService.eraseUserData(id, tenantId);
  }
}
