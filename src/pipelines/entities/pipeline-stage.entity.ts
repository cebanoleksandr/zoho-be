import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { TenantBaseEntity } from '../../common/entities/tenant-base.entity';
import { Pipeline } from './pipeline.entity';

@Entity('pipeline_stages')
export class PipelineStage extends TenantBaseEntity {
  @Index()
  @Column({ name: 'pipeline_id', type: 'uuid' })
  pipelineId: string;

  @ManyToOne(() => Pipeline, (pipeline) => pipeline.stages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: Pipeline;

  @Column()
  name: string;

  @Column({ name: 'order_index', type: 'int' })
  orderIndex: number;

  @Column({ type: 'int', default: 0 })
  probability: number;

  @Column({ name: 'is_won', default: false })
  isWon: boolean;

  @Column({ name: 'is_lost', default: false })
  isLost: boolean;
}
