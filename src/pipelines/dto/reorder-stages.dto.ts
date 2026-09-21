import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class ReorderStagesDto {
  /** Stage ids in the desired display order. Must include every stage of the pipeline exactly once. */
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  stageIds: string[];
}
