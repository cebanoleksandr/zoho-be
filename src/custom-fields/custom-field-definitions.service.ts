import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../common/tenancy/tenant-context';
import { CrmEntityType } from '../common/enums/crm-entity-type.enum';
import { CreateCustomFieldDefinitionDto } from './dto/create-custom-field-definition.dto';
import { UpdateCustomFieldDefinitionDto } from './dto/update-custom-field-definition.dto';
import { CustomFieldDefinition } from './entities/custom-field-definition.entity';

@Injectable()
export class CustomFieldDefinitionsService {
  constructor(
    @InjectRepository(CustomFieldDefinition)
    private readonly definitionsRepository: Repository<CustomFieldDefinition>,
  ) {}

  async create(
    dto: CreateCustomFieldDefinitionDto,
  ): Promise<CustomFieldDefinition> {
    const organizationId = TenantContext.getOrganizationId();
    const existing = await this.definitionsRepository.findOne({
      where: {
        organizationId,
        entityType: dto.entityType,
        fieldKey: dto.fieldKey,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Field "${dto.fieldKey}" already exists for ${dto.entityType}`,
      );
    }

    const definition = this.definitionsRepository.create({
      ...dto,
      organizationId,
      options: dto.options ?? null,
    });
    return this.definitionsRepository.save(definition);
  }

  findAll(entityType?: CrmEntityType): Promise<CustomFieldDefinition[]> {
    return this.definitionsRepository.find({
      where: {
        organizationId: TenantContext.getOrganizationId(),
        ...(entityType ? { entityType } : {}),
      },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<CustomFieldDefinition> {
    const definition = await this.definitionsRepository.findOne({
      where: { id, organizationId: TenantContext.getOrganizationId() },
    });
    if (!definition) {
      throw new NotFoundException('Custom field definition not found');
    }
    return definition;
  }

  async update(
    id: string,
    dto: UpdateCustomFieldDefinitionDto,
  ): Promise<CustomFieldDefinition> {
    const definition = await this.findOne(id);
    Object.assign(definition, dto);
    return this.definitionsRepository.save(definition);
  }

  async remove(id: string): Promise<void> {
    const definition = await this.findOne(id);
    await this.definitionsRepository.remove(definition);
  }
}
