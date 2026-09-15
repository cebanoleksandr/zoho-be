import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from '../../common/entities/tenant-base.entity';

@Entity('deals')
export class Deal extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  amount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Index()
  @Column({ name: 'account_id', type: 'uuid', nullable: true })
  accountId: string | null;

  @Index()
  @Column({ name: 'contact_id', type: 'uuid', nullable: true })
  contactId: string | null;

  @Index()
  @Column({ name: 'pipeline_id', type: 'uuid' })
  pipelineId: string;

  @Index()
  @Column({ name: 'stage_id', type: 'uuid' })
  stageId: string;

  @Index()
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  @Column({ name: 'expected_close_date', type: 'date', nullable: true })
  expectedCloseDate: string | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
