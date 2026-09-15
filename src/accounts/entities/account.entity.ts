import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from '../../common/entities/tenant-base.entity';

@Entity('accounts')
export class Account extends TenantBaseEntity {
  @Index()
  @Column()
  name: string;

  @Column({ nullable: true })
  industry: string | null;

  @Column({ nullable: true })
  website: string | null;

  @Column({ nullable: true })
  phone: string | null;

  @Column({ name: 'billing_address', nullable: true })
  billingAddress: string | null;

  @Index()
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
