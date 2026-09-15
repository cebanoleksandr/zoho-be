import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../common/tenancy/tenant-context';
import { CrmEntityLookupService } from '../common/tenancy/crm-entity-lookup.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityStatus } from './entities/activity-status.enum';
import { Activity } from './entities/activity.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activitiesRepository: Repository<Activity>,
    private readonly entityLookup: CrmEntityLookupService,
  ) {}

  async create(dto: CreateActivityDto): Promise<Activity> {
    const organizationId = TenantContext.getOrganizationId();
    await this.entityLookup.assertExists(
      dto.entityType,
      organizationId,
      dto.entityId,
    );

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
}
