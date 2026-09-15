import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContext } from './tenant-context';

/**
 * Runs after auth guards (JwtAuthGuard / ApiKeyGuard) have populated
 * request.user / request.apiKey, and stores the tenant scope in an
 * AsyncLocalStorage so services never have to thread organizationId
 * through every call manually.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const principal = request.user ?? request.apiKeyPrincipal;

    if (!principal?.organizationId) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      TenantContext.run(
        { organizationId: principal.organizationId, userId: principal.id },
        () => {
          next.handle().subscribe(subscriber);
        },
      );
    });
  }
}
