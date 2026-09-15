import { IsEnum } from 'class-validator';
import { LeadStatus } from '../entities/lead-status.enum';

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status: LeadStatus;
}
