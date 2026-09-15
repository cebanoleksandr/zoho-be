import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../common/tenancy/tenant-context';
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
    return pipeline;
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
}
