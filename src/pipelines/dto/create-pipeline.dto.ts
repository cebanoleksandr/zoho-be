import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateStageDto } from './create-stage.dto';

export class CreatePipelineDto {
  @IsString()
  name: string;

  /** Optional initial stages, in the order they should appear. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStageDto)
  stages?: CreateStageDto[];
}
