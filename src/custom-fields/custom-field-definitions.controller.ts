import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CrmEntityType } from '../common/enums/crm-entity-type.enum';
import { CustomFieldDefinitionsService } from './custom-field-definitions.service';
import { CreateCustomFieldDefinitionDto } from './dto/create-custom-field-definition.dto';
import { UpdateCustomFieldDefinitionDto } from './dto/update-custom-field-definition.dto';

@Controller('custom-fields/definitions')
export class CustomFieldDefinitionsController {
  constructor(
    private readonly definitionsService: CustomFieldDefinitionsService,
  ) {}

  @Post()
  create(@Body() dto: CreateCustomFieldDefinitionDto) {
    return this.definitionsService.create(dto);
  }

  @Get()
  findAll(@Query('entityType') entityType?: CrmEntityType) {
    return this.definitionsService.findAll(entityType);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.definitionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomFieldDefinitionDto,
  ) {
    return this.definitionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.definitionsService.remove(id);
  }
}
