import { Field, InputType, Int } from "@nestjs/graphql";
import { IsInt, IsString } from "class-validator";

@InputType()
export class SubmitQuizInput {
    @Field()
    @IsString()
    materialId: string;

    @Field()
    @IsString()
    aiOutputId: string;

    @Field()
    @IsString()
    userId: string;

    @Field(() => Int)
    @IsInt()
    score: number;
}