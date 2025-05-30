import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class FlashcardType {

    @Field()
    id: string;

    @Field()
    aiOutputId: string;

    @Field()
    question: string;

    @Field()
    answer: string;

    @Field()
    createdAt: Date;
}