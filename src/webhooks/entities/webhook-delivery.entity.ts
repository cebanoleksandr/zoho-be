import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from '../../common/entities/tenant-base.entity';
import { WebhookEvent } from './webhook-event.enum';

@Entity('webhook_deliveries')
export class WebhookDelivery extends TenantBaseEntity {
  @Index()
  @Column({ name: 'webhook_id', type: 'uuid' })
  webhookId: string;

  @Column({ type: 'enum', enum: WebhookEvent })
  event: WebhookEvent;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode: number | null;

  @Column({ default: false })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  error: string | null;
}
