import { Column, Entity, OneToMany } from 'typeorm';
import { TenantBaseEntity } from '../../common/entities/tenant-base.entity';
import { PipelineStage } from './pipeline-stage.entity';

@Entity('pipelines')
export class Pipeline extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @OneToMany(() => PipelineStage, (stage) => stage.pipeline)
  stages: PipelineStage[];
}
