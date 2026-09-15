import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../api-keys.service';
import { REQUIRED_SCOPE_KEY } from '../decorators/require-scope.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers['x-api-key'];
    const key = Array.isArray(header) ? header[0] : header;

    if (!key) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    const principal = await this.apiKeysService.validate(key);
    if (!principal) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    const requiredScope = this.reflector.getAllAndOverride<string>(
      REQUIRED_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (
      requiredScope &&
      !principal.scopes.includes('*') &&
      !principal.scopes.includes(requiredScope)
    ) {
      throw new ForbiddenException(
        `API key is missing required scope "${requiredScope}"`,
      );
    }

    request.apiKeyPrincipal = principal;
    return true;
  }
}
