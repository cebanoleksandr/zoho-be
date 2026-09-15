import { IsEnum, IsUUID } from 'class-validator';
import { CrmEntityType } from '../../common/enums/crm-entity-type.enum';

export class QueryCustomFieldValuesDto {
  @IsEnum(CrmEntityType)
  entityType: CrmEntityType;

  @IsUUID()
  entityId: string;
}
