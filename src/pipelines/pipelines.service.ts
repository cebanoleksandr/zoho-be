import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from '../deals/entities/deal.entity';
import { TenantContext } from '../common/tenancy/tenant-context';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { PipelineStage } from './entities/pipeline-stage.entity';
import { Pipeline } from './entities/pipeline.entity';

const DEFAULT_STAGES: Array<{
  name: string;
  orderIndex: number;
  probability: number;
  isWon?: boolean;
  isLost?: boolean;
}> = [
  { name: 'Qualification', orderIndex: 1, probability: 10 },
  { name: 'Needs Analysis', orderIndex: 2, probability: 30 },
  { name: 'Proposal', orderIndex: 3, probability: 50 },
  { name: 'Negotiation', orderIndex: 4, probability: 75 },
  { name: 'Closed Won', orderIndex: 5, probability: 100, isWon: true },
  { name: 'Closed Lost', orderIndex: 6, probability: 0, isLost: true },
];

@Injectable()
export class PipelinesService {
  constructor(
    @InjectRepository(Pipeline)
    private readonly pipelinesRepository: Repository<Pipeline>,
    @InjectRepository(PipelineStage)
    private readonly stagesRepository: Repository<PipelineStage>,
    @InjectRepository(Deal)
    private readonly dealsRepository: Repository<Deal>,
  ) {}

  async createDefaultPipeline(organizationId: string): Promise<Pipeline> {
    const pipeline = await this.pipelinesRepository.save(
      this.pipelinesRepository.create({
        organizationId,
        name: 'Sales Pipeline',
        isDefault: true,
      }),
    );

    await this.stagesRepository.save(
      DEFAULT_STAGES.map((stage) =>
        this.stagesRepository.create({
          organizationId,
          pipelineId: pipeline.id,
          name: stage.name,
          orderIndex: stage.orderIndex,
          probability: stage.probability,
          isWon: stage.isWon ?? false,
          isLost: stage.isLost ?? false,
        }),
      ),
    );

    return pipeline;
  }

  async getOrCreateDefaultPipeline(organizationId: string): Promise<Pipeline> {
    const existing = await this.pipelinesRepository.findOne({
      where: { organizationId, isDefault: true },
    });
    if (existing) {
      return existing;
    }
    return this.createDefaultPipeline(organizationId);
  }

  async create(dto: CreatePipelineDto): Promise<Pipeline> {
    const organizationId = TenantContext.getOrganizationId();
    const isFirstPipeline =
      (await this.pipelinesRepository.count({ where: { organizationId } })) ===
      0;

    const pipeline = await this.pipelinesRepository.save(
      this.pipelinesRepository.create({
        organizationId,
        name: dto.name,
        isDefault: isFirstPipeline,
      }),
    );

    const stageDtos = dto.stages?.length ? dto.stages : this.defaultStageDtos();
    await this.stagesRepository.save(
      stageDtos.map((stage, index) =>
        this.stagesRepository.create({
          organizationId,
          pipelineId: pipeline.id,
          name: stage.name,
          orderIndex: index + 1,
          probability: stage.probability ?? 0,
          isWon: stage.isWon ?? false,
          isLost: stage.isLost ?? false,
        }),
      ),
    );

    return this.findOne(pipeline.id);
  }

  async findAll(): Promise<Pipeline[]> {
    return this.pipelinesRepository.find({
      where: { organizationId: TenantContext.getOrganizationId() },
      relations: { stages: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Pipeline> {
    const pipeline = await this.pipelinesRepository.findOne({
      where: { id, organizationId: TenantContext.getOrganizationId() },
      relations: { stages: true },
    });
    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }
    pipeline.stages?.sort((a, b) => a.orderIndex - b.orderIndex);
    return pipeline;
  }

  async update(id: string, dto: UpdatePipelineDto): Promise<Pipeline> {
    const organizationId = TenantContext.getOrganizationId();
    const pipeline = await this.findOne(id);

    if (dto.isDefault) {
      await this.pipelinesRepository.update(
        { organizationId },
        { isDefault: false },
      );
    }

    Object.assign(pipeline, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
    });
    await this.pipelinesRepository.save(pipeline);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const organizationId = TenantContext.getOrganizationId();
    const pipeline = await this.findOne(id);

    const dealsCount = await this.dealsRepository.count({
      where: { organizationId, pipelineId: id },
    });
    if (dealsCount > 0) {
      throw new ConflictException(
        'Cannot delete a pipeline that still has deals',
      );
    }

    if (pipeline.isDefault) {
      const otherPipelinesCount = await this.pipelinesRepository.count({
        where: { organizationId },
      });
      if (otherPipelinesCount <= 1) {
        throw new ConflictException(
          'Cannot delete the only pipeline in the organization',
        );
      }
    }

    await this.pipelinesRepository.remove(pipeline);
  }

  async addStage(
    pipelineId: string,
    dto: CreateStageDto,
  ): Promise<PipelineStage> {
    const organizationId = TenantContext.getOrganizationId();
    const pipeline = await this.findOne(pipelineId);

    const maxOrder = await this.stagesRepository
      .createQueryBuilder('stage')
      .select('MAX(stage.order_index)', 'max')
      .where('stage.pipeline_id = :pipelineId', { pipelineId: pipeline.id })
      .getRawOne<{ max: number | null }>();

    return this.stagesRepository.save(
      this.stagesRepository.create({
        organizationId,
        pipelineId: pipeline.id,
        name: dto.name,
        orderIndex: (maxOrder?.max ?? 0) + 1,
        probability: dto.probability ?? 0,
        isWon: dto.isWon ?? false,
        isLost: dto.isLost ?? false,
      }),
    );
  }

  async updateStageDetails(
    pipelineId: string,
    stageId: string,
    dto: UpdateStageDto,
  ): Promise<PipelineStage> {
    const organizationId = TenantContext.getOrganizationId();
    const stage = await this.getStageInPipeline(
      organizationId,
      pipelineId,
      stageId,
    );
    Object.assign(stage, dto);
    return this.stagesRepository.save(stage);
  }

  async removeStage(pipelineId: string, stageId: string): Promise<void> {
    const organizationId = TenantContext.getOrganizationId();
    const stage = await this.getStageInPipeline(
      organizationId,
      pipelineId,
      stageId,
    );

    const dealsCount = await this.dealsRepository.count({
      where: { organizationId, stageId },
    });
    if (dealsCount > 0) {
      throw new ConflictException(
        'Cannot delete a stage that still has deals',
      );
    }

    await this.stagesRepository.remove(stage);
  }

  async reorderStages(
    pipelineId: string,
    dto: ReorderStagesDto,
  ): Promise<Pipeline> {
    const organizationId = TenantContext.getOrganizationId();
    const pipeline = await this.findOne(pipelineId);
    const existingIds = new Set(pipeline.stages.map((s) => s.id));

    if (
      dto.stageIds.length !== existingIds.size ||
      !dto.stageIds.every((id) => existingIds.has(id))
    ) {
      throw new BadRequestException(
        'stageIds must include every stage of this pipeline exactly once',
      );
    }

    await Promise.all(
      dto.stageIds.map((stageId, index) =>
        this.stagesRepository.update(
          { id: stageId, organizationId },
          { orderIndex: index + 1 },
        ),
      ),
    );

    return this.findOne(pipelineId);
  }

  async findStage(
    organizationId: string,
    stageId: string,
  ): Promise<PipelineStage> {
    const stage = await this.stagesRepository.findOne({
      where: { id: stageId, organizationId },
    });
    if (!stage) {
      throw new NotFoundException('Pipeline stage not found');
    }
    return stage;
  }

  async findFirstStage(
    organizationId: string,
    pipelineId: string,
  ): Promise<PipelineStage> {
    const stage = await this.stagesRepository.findOne({
      where: { organizationId, pipelineId },
      order: { orderIndex: 'ASC' },
    });
    if (!stage) {
      throw new NotFoundException('Pipeline has no stages');
    }
    return stage;
  }

  private async getStageInPipeline(
    organizationId: string,
    pipelineId: string,
    stageId: string,
  ): Promise<PipelineStage> {
    const stage = await this.stagesRepository.findOne({
      where: { id: stageId, organizationId, pipelineId },
    });
    if (!stage) {
      throw new NotFoundException('Pipeline stage not found');
    }
    return stage;
  }

  private defaultStageDtos(): CreateStageDto[] {
    return DEFAULT_STAGES.map((stage) => ({
      name: stage.name,
      probability: stage.probability,
      isWon: stage.isWon,
      isLost: stage.isLost,
    }));
  }
}
