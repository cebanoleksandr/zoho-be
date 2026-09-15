import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { ApiKeyGuard } from './api-key.guard';

/**
 * Global auth guard: accepts either a session JWT (dashboard users) or an
 * X-API-Key header (external apps / integrations), so every existing
 * resource endpoint works for both without duplicating controllers.
 */
@Injectable()
export class CompositeAuthGuard implements CanActivate {
  private readonly jwtGuard = new (AuthGuard('jwt'))();

  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {}

  canActivate(context: ExecutionContext): Promise<boolean> | boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (request.headers['x-api-key']) {
      return this.apiKeyGuard.canActivate(context);
    }

    return this.jwtGuard.canActivate(context) as Promise<boolean>;
  }
}
