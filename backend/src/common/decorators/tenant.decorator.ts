import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the tenant ID from the authenticated user's JWT payload.
 * Usage: @TenantId() tenantId: string
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenantId;
  },
);
