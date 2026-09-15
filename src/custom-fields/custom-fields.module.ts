import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmEntityLookupModule } from '../common/tenancy/crm-entity-lookup.module';
import { CustomFieldDefinitionsController } from './custom-field-definitions.controller';
import { CustomFieldDefinitionsService } from './custom-field-definitions.service';
import { CustomFieldValuesController } from './custom-field-values.controller';
import { CustomFieldValuesService } from './custom-field-values.service';
import { CustomFieldDefinition } from './entities/custom-field-definition.entity';
import { CustomFieldValue } from './entities/custom-field-value.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomFieldDefinition, CustomFieldValue]),
    CrmEntityLookupModule,
  ],
  controllers: [CustomFieldDefinitionsController, CustomFieldValuesController],
  providers: [CustomFieldDefinitionsService, CustomFieldValuesService],
})
export class CustomFieldsModule {}
