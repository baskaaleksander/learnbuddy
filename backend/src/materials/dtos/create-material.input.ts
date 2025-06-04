import { Field, InputType } from "@nestjs/graphql";
import { IsString } from "class-validator";

@InputType()
export class CreateMaterialInput {

    @Field()
    @IsString()
    title: string;

    @Field()
    @IsString()
    description: string;

    @Field()
    @IsString()
    id: string;

}