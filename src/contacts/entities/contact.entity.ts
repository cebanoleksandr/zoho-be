import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from '../../common/entities/tenant-base.entity';

@Entity('contacts')
export class Contact extends TenantBaseEntity {
  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  email: string | null;

  @Column({ nullable: true })
  phone: string | null;

  @Column({ nullable: true })
  title: string | null;

  @Index()
  @Column({ name: 'account_id', type: 'uuid', nullable: true })
  accountId: string | null;

  @Index()
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
