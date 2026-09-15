import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../common/tenancy/tenant-context';
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
  ) {}

  create(dto: CreateLeadDto): Promise<Lead> {
    const lead = this.leadsRepository.create({
      ...dto,
      organizationId: TenantContext.getOrganizationId(),
    });
    return this.leadsRepository.save(lead);
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
}
