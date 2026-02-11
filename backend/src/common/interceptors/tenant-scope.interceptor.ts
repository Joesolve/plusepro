import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Role } from '@prisma/client';

/**
 * Automatically injects the user's tenantId into request body
 * for create/update operations, ensuring tenant isolation.
 */
@Injectable()
export class TenantScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.role !== Role.SUPER_ADMIN && user.tenantId) {
      // Inject tenantId into body for POST/PUT/PATCH requests
      if (request.body && typeof request.body === 'object') {
        request.body.tenantId = user.tenantId;
      }

      // Store tenantId on request for service layer access
      request.tenantId = user.tenantId;
    }

    return next.handle();
  }
}
