import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from '../../common/entities/tenant-base.entity';
import { LeadSource } from './lead-source.enum';
import { LeadStatus } from './lead-status.enum';

@Entity('leads')
export class Lead extends TenantBaseEntity {
  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  email: string | null;

  @Column({ nullable: true })
  phone: string | null;

  @Column({ nullable: true })
  company: string | null;

  @Column({ nullable: true })
  title: string | null;

  @Column({ type: 'enum', enum: LeadSource, nullable: true })
  source: LeadSource | null;

  @Index()
  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status: LeadStatus;

  @Index()
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'converted_at', type: 'timestamptz', nullable: true })
  convertedAt: Date | null;

  @Column({ name: 'converted_account_id', type: 'uuid', nullable: true })
  convertedAccountId: string | null;

  @Column({ name: 'converted_contact_id', type: 'uuid', nullable: true })
  convertedContactId: string | null;

  @Column({ name: 'converted_deal_id', type: 'uuid', nullable: true })
  convertedDealId: string | null;
}
