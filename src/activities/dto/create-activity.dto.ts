import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CrmEntityType } from '../../common/enums/crm-entity-type.enum';
import { ActivityType } from '../entities/activity-type.enum';

export class CreateActivityDto {
  @IsEnum(CrmEntityType)
  entityType: CrmEntityType;

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
