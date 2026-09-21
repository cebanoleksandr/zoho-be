import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deal } from '../deals/entities/deal.entity';
import { PipelineStage } from './entities/pipeline-stage.entity';
import { Pipeline } from './entities/pipeline.entity';
import { PipelinesController } from './pipelines.controller';
import { PipelinesService } from './pipelines.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pipeline, PipelineStage, Deal])],
  controllers: [PipelinesController],
  providers: [PipelinesService],
  exports: [PipelinesService],
})
export class PipelinesModule {}
