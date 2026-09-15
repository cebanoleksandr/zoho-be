import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateCustomFieldDefinitionDto } from './create-custom-field-definition.dto';

export class UpdateCustomFieldDefinitionDto extends PartialType(
  PickType(CreateCustomFieldDefinitionDto, [
    'label',
    'options',
    'required',
  ] as const),
) {}
