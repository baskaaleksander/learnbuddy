import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class QuizResultType {

    @Field()
    id: string;

    @Field()
    userId: string;

    @Field()
    materialId: string;

    @Field()
    aiOutputId: string;

    @Field(() => Int)
    score: number;

    @Field(() => Int)
    totalQuestions: number;

    @Field()
    completedAt: Date;

}

