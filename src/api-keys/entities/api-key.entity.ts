import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from '../../common/entities/tenant-base.entity';

@Entity('api_keys')
export class ApiKey extends TenantBaseEntity {
  @Column()
  name: string;

  /** Public, non-secret identifier embedded in the issued key; used for O(1) lookup. */
  @Index({ unique: true })
  @Column()
  prefix: string;

  /** SHA-256 hash of the secret part of the key. The plaintext key is shown once, at creation. */
  @Column({ name: 'hashed_secret' })
  hashedSecret: string;

  @Column({ type: 'text', array: true, default: '{*}' })
  scopes: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string | null;
}
