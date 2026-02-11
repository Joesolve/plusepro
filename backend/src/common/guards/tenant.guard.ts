import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Ensures tenant-scoped resources are only accessed by users
 * belonging to that tenant. Super admins bypass this check.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // Super admins can access any tenant's data
    if (user.role === Role.SUPER_ADMIN) return true;

    // For routes with :tenantId param, verify it matches the user's tenant
    const paramTenantId = request.params?.tenantId;
    if (paramTenantId && paramTenantId !== user.tenantId) {
      throw new ForbiddenException('Access denied: tenant mismatch');
    }

    return true;
  }
}
