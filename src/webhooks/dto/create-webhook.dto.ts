import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { WebhookEvent } from '../entities/webhook-event.enum';

export class CreateWebhookDto {
  @IsUrl({ require_tld: false })
  url: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @IsOptional()
  @IsString()
  description?: string;
}
