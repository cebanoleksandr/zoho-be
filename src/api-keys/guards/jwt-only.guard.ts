import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Blocks API-key-authenticated requests from routes that manage API keys
 * themselves — a leaked key must not be usable to mint further keys.
 * Run after CompositeAuthGuard, which sets request.apiKeyPrincipal.
 */
@Injectable()
export class JwtOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.apiKeyPrincipal) {
      throw new ForbiddenException(
        'This endpoint requires a user session, not an API key',
      );
    }
    return true;
  }
}
