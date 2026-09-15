import { IsUUID } from 'class-validator';

export class UpdateDealStageDto {
  @IsUUID()
  stageId: string;
}
