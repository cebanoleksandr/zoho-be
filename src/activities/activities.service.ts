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
import { Deal } from '../deals/entities/deal.entity';
import { Lead } from '../leads/entities/lead.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityEntityType } from './entities/activity-entity-type.enum';
import { ActivityStatus } from './entities/activity-status.enum';
import { Activity } from './entities/activity.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activitiesRepository: Repository<Activity>,
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Deal)
    private readonly dealsRepository: Repository<Deal>,
  ) {}

  async create(dto: CreateActivityDto): Promise<Activity> {
    const organizationId = TenantContext.getOrganizationId();
    await this.assertTargetExists(organizationId, dto.entityType, dto.entityId);

    const activity = this.activitiesRepository.create({
      ...dto,
      organizationId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    });
    return this.activitiesRepository.save(activity);
  }

  async findAll(
    query: QueryActivitiesDto,
  ): Promise<{ data: Activity[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const [data, total] = await this.activitiesRepository.findAndCount({
      where: {
        organizationId: TenantContext.getOrganizationId(),
        ...(query.entityType ? { entityType: query.entityType } : {}),
        ...(query.entityId ? { entityId: query.entityId } : {}),
        ...(query.type ? { type: query.type } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      },
      order: { dueDate: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Activity> {
    const activity = await this.activitiesRepository.findOne({
      where: { id, organizationId: TenantContext.getOrganizationId() },
    });
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    return activity;
  }

  async update(id: string, dto: UpdateActivityDto): Promise<Activity> {
    const activity = await this.findOne(id);
    Object.assign(activity, {
      ...dto,
      ...(dto.dueDate !== undefined
        ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
        : {}),
    });
    return this.activitiesRepository.save(activity);
  }

  async complete(id: string): Promise<Activity> {
    const activity = await this.findOne(id);
    activity.status = ActivityStatus.COMPLETED;
    activity.completedAt = new Date();
    return this.activitiesRepository.save(activity);
  }

  async remove(id: string): Promise<void> {
    const activity = await this.findOne(id);
    await this.activitiesRepository.remove(activity);
  }

  private async assertTargetExists(
    organizationId: string,
    entityType: ActivityEntityType,
    entityId: string,
  ): Promise<void> {
    const repository = this.repositoryFor(entityType);
    const exists = await repository.exists({
      where: { id: entityId, organizationId },
    });
    if (!exists) {
      throw new BadRequestException(
        `${entityType} with id ${entityId} not found`,
      );
    }
  }

  private repositoryFor(
    entityType: ActivityEntityType,
  ): Repository<Lead> | Repository<Contact> | Repository<Account> | Repository<Deal> {
    switch (entityType) {
      case ActivityEntityType.LEAD:
        return this.leadsRepository;
      case ActivityEntityType.CONTACT:
        return this.contactsRepository;
      case ActivityEntityType.ACCOUNT:
        return this.accountsRepository;
      case ActivityEntityType.DEAL:
        return this.dealsRepository;
    }
  }
}
