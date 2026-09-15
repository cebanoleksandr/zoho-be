import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class ConvertLeadDealDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsUUID()
  pipelineId?: string;

  @IsOptional()
  @IsUUID()
  stageId?: string;
}

export class ConvertLeadDto {
  /** Reuse an existing account instead of creating a new one. */
  @IsOptional()
  @IsUUID()
  accountId?: string;

  /** Name for the new account, when accountId is not given. Falls back to the lead's company. */
  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @IsOptional()
  @IsBoolean()
  createDeal?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConvertLeadDealDto)
  deal?: ConvertLeadDealDto;
}
