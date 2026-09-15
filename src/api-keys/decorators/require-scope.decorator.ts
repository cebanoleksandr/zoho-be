import { SetMetadata } from '@nestjs/common';

export const REQUIRED_SCOPE_KEY = 'requiredScope';

/**
 * Marks a route as requiring a specific scope when called via API key.
 * JWT-authenticated (dashboard) requests are never scope-restricted —
 * this only constrains what an issued API key can do.
 */
export const RequireScope = (scope: string) =>
  SetMetadata(REQUIRED_SCOPE_KEY, scope);
