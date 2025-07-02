import { IsString } from 'class-validator';

export class NewPlanDto {
  @IsString()
  planName: string;

  @IsString()
  planInterval: string;
}
