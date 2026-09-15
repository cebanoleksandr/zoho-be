import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from '../../common/entities/tenant-base.entity';
import { WebhookEvent } from './webhook-event.enum';

@Entity('webhooks')
export class Webhook extends TenantBaseEntity {
  @Column()
  url: string;

  @Column()
  secret: string;

  @Column({ type: 'enum', enum: WebhookEvent, array: true })
  events: WebhookEvent[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ nullable: true })
  description: string | null;
}
