import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from '../../common/entities/tenant-base.entity';
import { CrmEntityType } from '../../common/enums/crm-entity-type.enum';
import { ActivityStatus } from './activity-status.enum';
import { ActivityType } from './activity-type.enum';

@Entity('activities')
@Index(['organizationId', 'entityType', 'entityId'])
export class Activity extends TenantBaseEntity {
  @Column({ name: 'entity_type', type: 'enum', enum: CrmEntityType })
  entityType: CrmEntityType;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ type: 'enum', enum: ActivityType })
  type: ActivityType;

  @Column()
  subject: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ type: 'enum', enum: ActivityStatus, default: ActivityStatus.PENDING })
  status: ActivityStatus;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Index()
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;
}
