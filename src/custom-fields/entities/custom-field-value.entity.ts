import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from '../../common/entities/tenant-base.entity';
import { CrmEntityType } from '../../common/enums/crm-entity-type.enum';

@Entity('custom_field_values')
@Index(['organizationId', 'entityType', 'entityId'])
@Index(['fieldDefinitionId', 'entityId'], { unique: true })
export class CustomFieldValue extends TenantBaseEntity {
  @Column({ name: 'field_definition_id', type: 'uuid' })
  fieldDefinitionId: string;

  @Column({ name: 'entity_type', type: 'enum', enum: CrmEntityType })
  entityType: CrmEntityType;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ type: 'jsonb' })
  value: string | number | boolean | null;
}
