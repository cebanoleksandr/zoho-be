import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { PipelinesService } from './pipelines.service';

@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Post()
  create(@Body() dto: CreatePipelineDto) {
    return this.pipelinesService.create(dto);
  }

  @Get()
  findAll() {
    return this.pipelinesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pipelinesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePipelineDto,
  ) {
    return this.pipelinesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pipelinesService.remove(id);
  }

  @Post(':id/stages')
  addStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateStageDto,
  ) {
    return this.pipelinesService.addStage(id, dto);
  }

  @Patch(':id/stages/reorder')
  reorderStages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderStagesDto,
  ) {
    return this.pipelinesService.reorderStages(id, dto);
  }

  @Patch(':id/stages/:stageId')
  updateStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() dto: UpdateStageDto,
  ) {
    return this.pipelinesService.updateStageDetails(id, stageId, dto);
  }

  @Delete(':id/stages/:stageId')
  removeStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stageId', ParseUUIDPipe) stageId: string,
  ) {
    return this.pipelinesService.removeStage(id, stageId);
  }
}
