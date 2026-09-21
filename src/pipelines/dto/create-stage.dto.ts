import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateStageDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @IsOptional()
  @IsBoolean()
  isWon?: boolean;

  @IsOptional()
  @IsBoolean()
  isLost?: boolean;
}
