import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmEntityLookupService } from '../common/tenancy/crm-entity-lookup.service';
import { CrmEntityType } from '../common/enums/crm-entity-type.enum';
import { TenantContext } from '../common/tenancy/tenant-context';
import { CustomFieldType } from './entities/custom-field-type.enum';
import { CustomFieldDefinition } from './entities/custom-field-definition.entity';
import { CustomFieldValue } from './entities/custom-field-value.entity';

@Injectable()
export class CustomFieldValuesService {
  constructor(
    @InjectRepository(CustomFieldValue)
    private readonly valuesRepository: Repository<CustomFieldValue>,
    @InjectRepository(CustomFieldDefinition)
    private readonly definitionsRepository: Repository<CustomFieldDefinition>,
    private readonly entityLookup: CrmEntityLookupService,
  ) {}

  async getValues(
    entityType: CrmEntityType,
    entityId: string,
  ): Promise<Record<string, unknown>> {
    const organizationId = TenantContext.getOrganizationId();
    const rows = await this.valuesRepository.find({
      where: { organizationId, entityType, entityId },
    });
    if (rows.length === 0) {
      return {};
    }

    const definitions = await this.definitionsRepository.find({
      where: { organizationId, entityType },
    });
    const keyById = new Map(definitions.map((d) => [d.id, d.fieldKey]));

    const result: Record<string, unknown> = {};
    for (const row of rows) {
      const key = keyById.get(row.fieldDefinitionId);
      if (key) {
        result[key] = row.value;
      }
    }
    return result;
  }

  async setValues(
    entityType: CrmEntityType,
    entityId: string,
    values: Record<string, string | number | boolean | null>,
  ): Promise<Record<string, unknown>> {
    const organizationId = TenantContext.getOrganizationId();
    await this.entityLookup.assertExists(entityType, organizationId, entityId);

    const definitions = await this.definitionsRepository.find({
      where: { organizationId, entityType },
    });
    const definitionByKey = new Map(definitions.map((d) => [d.fieldKey, d]));

    for (const [key, value] of Object.entries(values)) {
      const definition = definitionByKey.get(key);
      if (!definition) {
        throw new BadRequestException(`Unknown custom field "${key}"`);
      }
      this.assertValueMatchesType(definition, value);
    }

    for (const [key, value] of Object.entries(values)) {
      const definition = definitionByKey.get(key)!;
      const existing = await this.valuesRepository.findOne({
        where: {
          organizationId,
          fieldDefinitionId: definition.id,
          entityId,
        },
      });

      if (existing) {
        existing.value = value;
        await this.valuesRepository.save(existing);
      } else {
        await this.valuesRepository.save(
          this.valuesRepository.create({
            organizationId,
            entityType,
            entityId,
            fieldDefinitionId: definition.id,
            value,
          }),
        );
      }
    }

    return this.getValues(entityType, entityId);
  }

  private assertValueMatchesType(
    definition: CustomFieldDefinition,
    value: string | number | boolean | null,
  ): void {
    if (value === null) {
      if (definition.required) {
        throw new BadRequestException(
          `Field "${definition.fieldKey}" is required`,
        );
      }
      return;
    }

    switch (definition.fieldType) {
      case CustomFieldType.NUMBER:
        if (typeof value !== 'number') {
          throw new BadRequestException(
            `Field "${definition.fieldKey}" must be a number`,
          );
        }
        break;
      case CustomFieldType.BOOLEAN:
        if (typeof value !== 'boolean') {
          throw new BadRequestException(
            `Field "${definition.fieldKey}" must be a boolean`,
          );
        }
        break;
      case CustomFieldType.DATE:
        if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
          throw new BadRequestException(
            `Field "${definition.fieldKey}" must be an ISO date string`,
          );
        }
        break;
      case CustomFieldType.SELECT:
        if (
          typeof value !== 'string' ||
          !(definition.options ?? []).includes(value)
        ) {
          throw new BadRequestException(
            `Field "${definition.fieldKey}" must be one of: ${(definition.options ?? []).join(', ')}`,
          );
        }
        break;
      case CustomFieldType.TEXT:
        if (typeof value !== 'string') {
          throw new BadRequestException(
            `Field "${definition.fieldKey}" must be text`,
          );
        }
        break;
    }
  }
}
