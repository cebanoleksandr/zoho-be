import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/account.entity';
import { TenantContext } from '../common/tenancy/tenant-context';
import { Contact } from '../contacts/entities/contact.entity';
import { PipelinesService } from '../pipelines/pipelines.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { QueryDealsDto } from './dto/query-deals.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { Deal } from './entities/deal.entity';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealsRepository: Repository<Deal>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
    private readonly pipelinesService: PipelinesService,
  ) {}

  async create(dto: CreateDealDto): Promise<Deal> {
    const organizationId = TenantContext.getOrganizationId();

    if (dto.accountId) {
      await this.assertExists(
        this.accountsRepository,
        organizationId,
        dto.accountId,
        'Account',
      );
    }
    if (dto.contactId) {
      await this.assertExists(
        this.contactsRepository,
        organizationId,
        dto.contactId,
        'Contact',
      );
    }

    const pipeline = dto.pipelineId
      ? await this.pipelinesService.findOne(dto.pipelineId)
      : await this.pipelinesService.getOrCreateDefaultPipeline(organizationId);

    const stage = dto.stageId
      ? await this.pipelinesService.findStage(organizationId, dto.stageId)
      : await this.pipelinesService.findFirstStage(organizationId, pipeline.id);

    if (stage.pipelineId !== pipeline.id) {
      throw new BadRequestException('Stage does not belong to the pipeline');
    }

    const deal = this.dealsRepository.create({
      ...dto,
      organizationId,
      pipelineId: pipeline.id,
      stageId: stage.id,
      closedAt: stage.isWon || stage.isLost ? new Date() : null,
    });
    return this.dealsRepository.save(deal);
  }

  async findAll(
    query: QueryDealsDto,
  ): Promise<{ data: Deal[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await this.dealsRepository.findAndCount({
      where: {
        organizationId: TenantContext.getOrganizationId(),
        ...(query.pipelineId ? { pipelineId: query.pipelineId } : {}),
        ...(query.stageId ? { stageId: query.stageId } : {}),
        ...(query.accountId ? { accountId: query.accountId } : {}),
        ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Deal> {
    const deal = await this.dealsRepository.findOne({
      where: { id, organizationId: TenantContext.getOrganizationId() },
    });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }
    return deal;
  }

  async update(id: string, dto: UpdateDealDto): Promise<Deal> {
    const deal = await this.findOne(id);

    if (dto.accountId) {
      await this.assertExists(
        this.accountsRepository,
        deal.organizationId,
        dto.accountId,
        'Account',
      );
    }
    if (dto.contactId) {
      await this.assertExists(
        this.contactsRepository,
        deal.organizationId,
        dto.contactId,
        'Contact',
      );
    }

    Object.assign(deal, dto);
    return this.dealsRepository.save(deal);
  }

  async updateStage(id: string, stageId: string): Promise<Deal> {
    const deal = await this.findOne(id);
    const stage = await this.pipelinesService.findStage(
      deal.organizationId,
      stageId,
    );
    if (stage.pipelineId !== deal.pipelineId) {
      throw new BadRequestException('Stage does not belong to this pipeline');
    }

    deal.stageId = stage.id;
    deal.closedAt = stage.isWon || stage.isLost ? new Date() : null;
    return this.dealsRepository.save(deal);
  }

  async remove(id: string): Promise<void> {
    const deal = await this.findOne(id);
    await this.dealsRepository.remove(deal);
  }

  private async assertExists(
    repository: Repository<Account> | Repository<Contact>,
    organizationId: string,
    id: string,
    label: string,
  ): Promise<void> {
    const exists = await repository.exists({ where: { id, organizationId } });
    if (!exists) {
      throw new BadRequestException(`${label} not found`);
    }
  }
}
