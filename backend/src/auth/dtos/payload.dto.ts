import { IsString } from "class-validator";

export class PayloadDto {
    @IsString()
    email: string;
    @IsString()
    id: string;
    @IsString()
    role: string;
}