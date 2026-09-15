import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { CrmEntityType } from '../../common/enums/crm-entity-type.enum';
import { CustomFieldType } from '../entities/custom-field-type.enum';

export class CreateCustomFieldDefinitionDto {
  @IsEnum(CrmEntityType)
  entityType: CrmEntityType;

  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message:
      'fieldKey must be snake_case, starting with a letter (e.g. industry_segment)',
  })
  fieldKey: string;

  @IsString()
  label: string;

  @IsEnum(CustomFieldType)
  fieldType: CustomFieldType;

  @ValidateIf((dto) => dto.fieldType === CustomFieldType.SELECT)
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}
