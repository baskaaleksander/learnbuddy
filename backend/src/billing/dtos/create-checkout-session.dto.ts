import { IsString } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  priceId: string;

  @IsString()
  plan: 'free' | 'tier1' | 'tier2' | 'unlimited';
}
