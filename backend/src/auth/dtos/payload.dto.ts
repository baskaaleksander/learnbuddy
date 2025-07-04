import { IsNumber, IsString } from 'class-validator';

export class PayloadDto {
  @IsString()
  email: string;
  @IsString()
  id: string;
  @IsString()
  role: string;
  @IsString()
  firstName: string;
  @IsNumber()
  tokensUsed: number;
}
