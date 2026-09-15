import { UserRole } from '../../users/entities/user-role.enum';

export interface JwtPayload {
  sub: string;
  organizationId: string;
  email: string;
  role: UserRole;
}
