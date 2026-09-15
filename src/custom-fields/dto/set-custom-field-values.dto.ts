import { IsEnum, IsObject, IsUUID } from 'class-validator';
import { CrmEntityType } from '../../common/enums/crm-entity-type.enum';

export class SetCustomFieldValuesDto {
  @IsEnum(CrmEntityType)
  entityType: CrmEntityType;

  @IsUUID()
  entityId: string;

  /** Map of fieldKey -> value. */
  @IsObject()
  values: Record<string, string | number | boolean | null>;
}
