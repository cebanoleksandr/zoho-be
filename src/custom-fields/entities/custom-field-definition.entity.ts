import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from '../../common/entities/tenant-base.entity';
import { CrmEntityType } from '../../common/enums/crm-entity-type.enum';
import { CustomFieldType } from './custom-field-type.enum';

@Entity('custom_field_definitions')
@Index(['organizationId', 'entityType', 'fieldKey'], { unique: true })
export class CustomFieldDefinition extends TenantBaseEntity {
  @Column({ name: 'entity_type', type: 'enum', enum: CrmEntityType })
  entityType: CrmEntityType;

  /** Stable machine key, e.g. "industry_segment". Immutable after creation. */
  @Column({ name: 'field_key' })
  fieldKey: string;

  @Column()
  label: string;

  @Column({ name: 'field_type', type: 'enum', enum: CustomFieldType })
  fieldType: CustomFieldType;

  /** Choices for SELECT fields. */
  @Column({ type: 'jsonb', nullable: true })
  options: string[] | null;

  @Column({ default: false })
  required: boolean;
}
