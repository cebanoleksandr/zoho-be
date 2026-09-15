import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { CustomFieldValuesService } from './custom-field-values.service';
import { QueryCustomFieldValuesDto } from './dto/query-custom-field-values.dto';
import { SetCustomFieldValuesDto } from './dto/set-custom-field-values.dto';

@Controller('custom-fields/values')
export class CustomFieldValuesController {
  constructor(private readonly valuesService: CustomFieldValuesService) {}

  @Get()
  getValues(@Query() query: QueryCustomFieldValuesDto) {
    return this.valuesService.getValues(query.entityType, query.entityId);
  }

  @Put()
  setValues(@Body() dto: SetCustomFieldValuesDto) {
    return this.valuesService.setValues(
      dto.entityType,
      dto.entityId,
      dto.values,
    );
  }
}
