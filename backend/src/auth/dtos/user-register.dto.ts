import { IsEmail, IsString } from "class-validator";

export class UserRegisterDto {

    @IsEmail()
    email: string;
    @IsString()
    password: string;

    @IsString()
    firstName: string;
}