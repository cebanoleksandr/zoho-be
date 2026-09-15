import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Account } from '../accounts/entities/account.entity';
import { TenantContext } from '../common/tenancy/tenant-context';
import { Contact } from '../contacts/entities/contact.entity';
import { Deal } from '../deals/entities/deal.entity';
import { PipelinesService } from '../pipelines/pipelines.service';
import { WebhookEvent } from '../webhooks/entities/webhook-event.enum';
import { WebhooksService } from '../webhooks/webhooks.service';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadStatus } from './entities/lead-status.enum';
import { Lead } from './entities/lead.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
    @InjectRepository(Deal)
    private readonly dealsRepository: Repository<Deal>,
    private readonly pipelinesService: PipelinesService,
    private readonly webhooksService: WebhooksService,
  ) {}

  async create(dto: CreateLeadDto): Promise<Lead> {
    const organizationId = TenantContext.getOrganizationId();
    const lead = this.leadsRepository.create({ ...dto, organizationId });
    const saved = await this.leadsRepository.save(lead);

    this.webhooksService
      .dispatch(organizationId, WebhookEvent.LEAD_CREATED, { lead: saved })
      .catch(() => undefined);

    return saved;
  }

  async findAll(
    query: QueryLeadsDto,
  ): Promise<{ data: Lead[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await this.leadsRepository.findAndCount({
      where: {
        organizationId: TenantContext.getOrganizationId(),
        ...(query.status ? { status: query.status } : {}),
        ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({
      where: { id, organizationId: TenantContext.getOrganizationId() },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findOne(id);
    Object.assign(lead, dto);
    return this.leadsRepository.save(lead);
  }

  async updateStatus(id: string, status: LeadStatus): Promise<Lead> {
    const lead = await this.findOne(id);
    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Converted leads cannot change status');
    }
    lead.status = status;
    if (status === LeadStatus.CONVERTED) {
      lead.convertedAt = new Date();
    }
    return this.leadsRepository.save(lead);
  }

  async remove(id: string): Promise<void> {
    const lead = await this.findOne(id);
    await this.leadsRepository.remove(lead);
  }

  async convert(
    id: string,
    dto: ConvertLeadDto,
  ): Promise<{ lead: Lead; account: Account; contact: Contact; deal: Deal | null }> {
    const organizationId = TenantContext.getOrganizationId();
    const lead = await this.findOne(id);

    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Lead is already converted');
    }

    const pipeline = dto.createDeal
      ? dto.deal?.pipelineId
        ? await this.pipelinesService.findOne(dto.deal.pipelineId)
        : await this.pipelinesService.getOrCreateDefaultPipeline(
            organizationId,
          )
      : null;
    const stage =
      dto.createDeal && pipeline
        ? dto.deal?.stageId
          ? await this.pipelinesService.findStage(
              organizationId,
              dto.deal.stageId,
            )
          : await this.pipelinesService.findFirstStage(
              organizationId,
              pipeline.id,
            )
        : null;
    if (stage && pipeline && stage.pipelineId !== pipeline.id) {
      throw new BadRequestException('Stage does not belong to the pipeline');
    }

    const ownerId = dto.ownerId ?? lead.ownerId;

    return this.leadsRepository.manager.transaction(async (manager) => {
      const account = await this.resolveAccount(
        manager,
        organizationId,
        lead,
        dto,
        ownerId,
      );

      const contact = await manager.save(
        Contact,
        manager.create(Contact, {
          organizationId,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          title: lead.title,
          accountId: account.id,
          ownerId,
        }),
      );

      let deal: Deal | null = null;
      if (dto.createDeal && pipeline && stage) {
        deal = await manager.save(
          Deal,
          manager.create(Deal, {
            organizationId,
            name: dto.deal?.name ?? `${account.name} Deal`,
            amount: dto.deal?.amount ?? 0,
            accountId: account.id,
            contactId: contact.id,
            pipelineId: pipeline.id,
            stageId: stage.id,
            ownerId,
            closedAt: stage.isWon || stage.isLost ? new Date() : null,
          }),
        );
      }

      lead.status = LeadStatus.CONVERTED;
      lead.convertedAt = new Date();
      lead.convertedAccountId = account.id;
      lead.convertedContactId = contact.id;
      lead.convertedDealId = deal?.id ?? null;
      const savedLead = await manager.save(Lead, lead);

      return { lead: savedLead, account, contact, deal };
    }).then((result) => {
      this.webhooksService
        .dispatch(organizationId, WebhookEvent.LEAD_CONVERTED, {
          leadId: result.lead.id,
          accountId: result.account.id,
          contactId: result.contact.id,
          dealId: result.deal?.id ?? null,
        })
        .catch(() => undefined);
      return result;
    });
  }

  private async resolveAccount(
    manager: EntityManager,
    organizationId: string,
    lead: Lead,
    dto: ConvertLeadDto,
    ownerId: string | null,
  ): Promise<Account> {
    if (dto.accountId) {
      const account = await manager.findOne(Account, {
        where: { id: dto.accountId, organizationId },
      });
      if (!account) {
        throw new BadRequestException('Account not found');
      }
      return account;
    }

    const name =
      dto.accountName ?? lead.company ?? `${lead.firstName} ${lead.lastName}`;
    return manager.save(
      Account,
      manager.create(Account, { organizationId, name, ownerId }),
    );
  }
}
