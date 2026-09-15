import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ActivityEntityType } from '../entities/activity-entity-type.enum';
import { ActivityType } from '../entities/activity-type.enum';

export class CreateActivityDto {
  @IsEnum(ActivityEntityType)
  entityType: ActivityEntityType;

  @IsUUID()
  entityId: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
